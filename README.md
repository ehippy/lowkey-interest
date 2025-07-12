# lowkey-interest

A minimalist serverless backend for collecting people's interest in lowkey using AWS Lambda, API Gateway, and DynamoDB.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Deploy to AWS:**
   ```bash
   npm run deploy
   ```

3. **Test the API:**
   ```bash
   # Submit interest
   curl -X POST https://your-api-url/interest \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   
   # Get signup count
   curl https://your-api-url/count
   ```

## Live Endpoints

**Development:**
- POST: `https://vjt43fk1d3.execute-api.us-east-1.amazonaws.com/dev/interest`
- GET: `https://vjt43fk1d3.execute-api.us-east-1.amazonaws.com/dev/count`

**Production:**
- POST: `https://asfurk8l78.execute-api.us-east-1.amazonaws.com/prod/interest`
- GET: `https://asfurk8l78.execute-api.us-east-1.amazonaws.com/prod/count`

4. **Remove everything:**
   ```bash
   npm run remove
   ```

## API

**POST /interest**
- Body: `{"email": "user@example.com"}`
- Response: `{"message": "Interest recorded successfully", "email": "user@example.com", "timestamp": "2025-07-07T12:34:56.789Z"}`

**GET /count**
- No body required
- Response: `{"spotsRemaining": 345, "timestamp": "2025-07-07T12:34:56.789Z"}`
- Perfect for adding social proof and urgency to your frontend
- `urgencyLevel` can be: "low", "medium", "high", or "critical"
- `spotsRemaining` shows remaining spots (without exposing the total limit)

## What Gets Created

- Lambda functions to handle POST and GET requests
- API Gateway endpoints (/interest and /count)
- DynamoDB table with automatic counter tracking (pay-per-request)
- SNS topic for email notifications
- All IAM permissions

## Files

- `serverless.yml` - Infrastructure configuration
- `handler.js` - Lambda function code
- `package.json` - Dependencies

That's it! 🚀
