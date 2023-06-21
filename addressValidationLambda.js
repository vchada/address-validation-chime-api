import AWS from 'aws-sdk';

export const handler = async (event, context) => {
  try {
    // Initialize Amazon Chime SDK
    const chime = new AWS.Chime({ region: 'us-east-1' });

    // Extract the required parameters from the event payload
    const {
      AwsAccountId,
      StreetNumber,
      StreetInfo,
      City,
      State,
      Country,
      PostalCode
    } = event;

    // Validate the E911 address using the Amazon Chime API
    const validateAddressResponse = await chime.validateE911Address({
      AwsAccountId,
      StreetNumber,
      StreetInfo,
      City,
      State,
      Country,
      PostalCode
    }).promise();

    // Return the response from the ValidateE911Address API call
    return {
      statusCode: 200,
      body: JSON.stringify(validateAddressResponse),
    };
  } catch (error) {
    // Handle any errors and return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
