const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
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
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        totalSignups: count,
        message: count > 0 ? `${count} people are already interested! 🔥` : 'Be the first to join!',
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
