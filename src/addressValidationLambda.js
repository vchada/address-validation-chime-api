import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const chime = new AWS.Chime({ region: 'us-east-1' });

async function validateAddress(address) {
  console.log('Entered Validate Address:', address);
  try {
    console.log('Street Info:',address.StreetInfo)
    console.log('city',address.City)
    console.log('state',address.State)
    console.log('country',address.Country)
    console.log('postalCode',address.PostalCode);
    const streetNumber1 = address.StreetNumber;
    console.log('streetNumber:',streetNumber1);
    
    // Extract the required parameters from the event payload
    let parsedAddress;

    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (error) {
        console.error('Error parsing address:', error);
        throw new Error('Invalid address format');
      }
    } else if (typeof address === 'object') {
      parsedAddress = address;
    } else {
      throw new Error('Invalid address format');
    }
    
    // Destructure the parsed address
    const {
      AwsAccountId,
      StreetNumber,
      StreetInfo,
      City,
      State,
      Country,
      PostalCode
    } = parsedAddress;
    
  
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
  
    console.log('Chime API call completed. and validation response:',validateAddressResponse);
   
    let ValidationResult, AddressExternalId, CandidateAddressList;

if (validateAddressResponse.ValidationResult === 0 || validateAddressResponse.ValidationResult === 1) {
  const { Address } = validateAddressResponse;
  ValidationResult = validateAddressResponse.ValidationResult;
  AddressExternalId = validateAddressResponse.AddressExternalId;
  CandidateAddressList = [Address];
} else {
  const {
    ValidationResult: vr,
    AddressExternalId: aeid,
    CandidateAddressList: [{
      streetInfo,
      streetSuffix,
      postDirectional,
      preDirectional,
      streetNumber,
      city,
      state,
      postalCode,
      postalCodePlus4,
      country
    }]
  } = validateAddressResponse;
  ValidationResult = vr;
  AddressExternalId = aeid;
  CandidateAddressList = [{
    streetInfo,
    streetSuffix,
    postDirectional,
    preDirectional,
    streetNumber,
    city,
    state,
    postalCode,
    postalCodePlus4,
    country
  }];
}

const mappedValidateAddressResponse = {
  ValidationResult,
  AddressExternalId,
  CandidateAddressList
};

      
    console.log('validateAddressResponse:', mappedValidateAddressResponse);
   
    // Construct the validated address object
    const validatedAddress = {
      ValidationResult,
      AddressExternalId,
      mappedValidateAddressResponse: address
    };

    console.log('Address validation successful:', validatedAddress);
  

    return { validatedAddress };
  } catch (error) {
    console.error('Chime address validation failed:', error);
    throw new Error(`Chime address validation failed: ${error.Message}`);
  }
}

//funtion to convert the address to civic address format 
function convertToCivicAddress(address) {
    console.log('Entered Address in civic address block',address);
    const civicAddress = {
      country: address.Country,
      RD: address.preDirectional ? `${address.preDirectional} ${address.streetInfo}` : address.StreetInfo,
      A3: address.City,
      PC: address.PostalCode,
      HNO: address.StreetNumber,
      STS: address.streetSuffix,
      A1: address.State
    };
  
    return civicAddress;
  }

export const handler = async (event, context) => {
  try {
    if (event.httpMethod === 'GET') {
      // Perform GET operation to retrieve values from DynamoDB based on key
      const { EmployeeId } = event.queryStringParameters;
      console.log('GET request received for EmployeeId:', EmployeeId);

      const params = {
        TableName: 'agent-contacts',
        Key: { "EmployeeId": EmployeeId }
      };
      const result = await dynamoDB.get(params).promise();
      const item = result.Item;

      if (!item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Item not found' })
        };
      }

      console.log('GET request successful. Retrieved item:', item);

      return {
        statusCode: 200,
        body: JSON.stringify(item)
      };
    } else if (event.httpMethod === 'POST') {
      // Perform POST operation to validate addresses using Chime API and update the addresses
      const body = JSON.parse(event.body);
      const {
        EmployeeId,
        homeAddress,
        workAddress,
        otherAddress,
        preferredAddress,
        email
      } = body;

      console.log('POST request received for EmployeeId:', EmployeeId);
      console.log('homeAddress:', homeAddress);
      console.log('workAddress:', workAddress);
      console.log('otherAddress:', otherAddress);
      
       // Convert all addresses to Civic Address
       const civicHomeAddress = convertToCivicAddress(homeAddress);
       const civicWorkAddress = convertToCivicAddress(workAddress);
 
       // Validate only the otherAddress using Chime API
       const validateOtherAddressResponse = await validateAddress(otherAddress);
       const { validatedAddress: validatedOtherAddress } = validateOtherAddressResponse;
       console.log(validateOtherAddressResponse);
       const civicOtherAddress = convertToCivicAddress(validatedOtherAddress.mappedValidateAddressResponse);

      console.log('Address validation completed');

      // Update the addresses in DynamoDB
      const updateParams = {
        TableName: 'agent-contacts',
        Key: { "EmployeeId": EmployeeId },
        UpdateExpression: 'SET HomeAddress = :homeAddress, HomeCivicAddress = :homeCivicAddress, WorkAddress = :workAddress, WorkCivicAddress = :workCivicAddress, OtherAddress = :otherAddress, OtherCivicAddress = :otherCivicAddress, PreferredAddress = :preferredAddress, Email =:email',
        ExpressionAttributeValues: {
          ':homeAddress': homeAddress,
          ':homeCivicAddress': civicHomeAddress,
          ':workAddress': workAddress,
          ':workCivicAddress': civicWorkAddress,
          ':otherAddress': validatedOtherAddress,
          ':otherCivicAddress': civicOtherAddress,
          ':preferredAddress': preferredAddress,
          ':email': email
        }
      };

      console.log('Updating addresses in DynamoDB:', updateParams);

      await dynamoDB.update(updateParams).promise();

      console.log('Update successful');

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Update successful' })
      };
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }
  } catch (error) {
    console.error('An error occurred:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
