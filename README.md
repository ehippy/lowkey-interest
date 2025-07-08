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
   curl -X POST https://your-api-url/interest \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

4. **Remove everything:**
   ```bash
   npm run remove
   ```

## API

**POST /interest**
- Body: `{"email": "user@example.com"}`
- Response: `{"message": "Interest recorded successfully", "email": "user@example.com", "timestamp": "2025-07-07T12:34:56.789Z"}`

## What Gets Created

- Lambda function to handle POST requests
- API Gateway endpoint
- DynamoDB table (pay-per-request)
- All IAM permissions

## Files

- `serverless.yml` - Infrastructure configuration
- `handler.js` - Lambda function code
- `package.json` - Dependencies

That's it! 🚀
