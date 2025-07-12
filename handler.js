const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({ region: process.env.AWS_REGION });

// Shared CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

module.exports.submitInterest = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    const { email } = JSON.parse(event.body);

    // Validate email
    if (!email || typeof email !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Valid email is required' }),
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // Create timestamp
    const timestamp = new Date().toISOString();

    // Check if email already exists
    const checkParams = {
      TableName: process.env.DYNAMODB_TABLE,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim()
      },
      Limit: 1
    };

    const existingUser = await dynamodb.send(new QueryCommand(checkParams));
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Email already registered',
          email: email.toLowerCase().trim(),
          timestamp: existingUser.Items[0].timestamp,
          alreadyExists: true,
        }),
      };
    }

    // Save to DynamoDB
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        email: email.toLowerCase().trim(),
        timestamp,
        created_at: Date.now(),
      },
    };

    await dynamodb.send(new PutCommand(params));

    // Update counter entry
    const counterParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        email: '__COUNTER__',
        timestamp: 'count'
      },
      UpdateExpression: 'ADD signupCount :inc',
      ExpressionAttributeValues: {
        ':inc': 1
      }
    };
    
    await dynamodb.send(new UpdateCommand(counterParams));

    // Send notification
    const notificationParams = {
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: `🚀 New lowkey Signup - ${email.toLowerCase().trim()}`,
      Message: `New email signup: ${email.toLowerCase().trim()}\nTime: ${timestamp}\n\nSomeone is interested in lowkey! 🎉`
    };

    await sns.send(new PublishCommand(notificationParams));

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Interest recorded successfully',
        email: email.toLowerCase().trim(),
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

module.exports.getCount = async (event) => {
  console.log('Received count request:', JSON.stringify(event, null, 2));
  
  try {
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // Internal limit (not exposed to client)
    const MAX_SPOTS = 387;

    // Get counter entry from DynamoDB
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        email: '__COUNTER__',
        timestamp: 'count'
      }
    };

    const result = await dynamodb.send(new GetCommand(params));
    const count = result.Item?.signupCount || 0;
    const spotsLeft = Math.max(0, MAX_SPOTS - count);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        spotsRemaining: spotsLeft > 0 ? spotsLeft : 0,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error getting count:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
