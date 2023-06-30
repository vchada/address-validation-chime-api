import AWS from 'aws-sdk';

export const handler = async (event, context) => {
  try {
    // Initialize Amazon Chime SDK
    const chime = new AWS.Chime({ region: 'us-east-1' });

    // Extract the required parameters from the event body
    const {
      AwsAccountId,
      StreetNumber,
      StreetInfo,
      City,
      State,
      Country,
      PostalCode
    } = JSON.parse(event.body);

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

    const {
      ValidationResult,
      AddressExternalId,
      Address: {
        streetName,
        streetSuffix,
        postDirectional,
        preDirectional,
        streetNumber,
        city,
        state,
        postalCode,
        postalCodePlus4,
        country
      }
    } = validateAddressResponse;
    
    // Format the address as needed
    const formattedAddress = `${streetNumber} ${preDirectional || ''} ${streetName} ${streetSuffix || ''} ${postDirectional || ''}, ${city}, ${state} ${postalCode}${postalCodePlus4 ? `-${postalCodePlus4}` : ''}, ${country}`;

    // Construct the Civic Address JSON object
    const civicAddress = {
      country: country,
      RD: preDirectional ? preDirectional + ' ' + streetNumber : streetNumber,
      A3: city,
      PC: postalCode,
      HNO: streetNumber,
      STS: streetSuffix,
      A1: state
    };
   
    // Return the response from the ValidateE911Address API call
    return {
       statusCode: 200,
      body: JSON.stringify({
        ValidationResult,
        AddressExternalId,
        CivicAddress: civicAddress
      }),
    };
  } catch (error) {
    // Handle any errors and return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
