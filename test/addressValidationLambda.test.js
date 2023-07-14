const eventGet = {
  httpMethod: 'GET',
  queryStringParameters: {
    EmployeeId: '123'
  }
};

const eventPost = {
  httpMethod: 'POST',
  body: JSON.stringify({
    EmployeeId: '123',
    homeAddress: {
      StreetNumber: '123',
      StreetInfo: 'Main St',
      City: 'Seattle',
      State: 'WA',
      Country: 'USA',
      PostalCode: '98101'
    },
    workAddress: {
      StreetNumber: '456',
      StreetInfo: 'Broadway Ave',
      City: 'New York',
      State: 'NY',
      Country: 'USA',
      PostalCode: '10001'
    },
    otherAddress: {
      StreetNumber: '789',
      StreetInfo: 'Park Blvd',
      City: 'San Francisco',
      State: 'CA',
      Country: 'USA',
      PostalCode: '94101'
    },
    preferredAddress: 'home',
    email: 'test@example.com'
  })
};

const eventInvalid = {
  httpMethod: 'PUT',
  body: JSON.stringify({
    EmployeeId: '123',
    homeAddress: {
      StreetNumber: '123',
      StreetInfo: 'Main St',
      City: 'Seattle',
      State: 'WA',
      Country: 'USA',
      PostalCode: '98101'
    }
  })
};

// Mock DynamoDB.get() and DynamoDB.update() functions for testing
const dynamoDBGetMock = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Item: {
      EmployeeId: '123',
      HomeAddress: {
        StreetNumber: '123',
        StreetInfo: 'Main St',
        City: 'Seattle',
        State: 'WA',
        Country: 'USA',
        PostalCode: '98101'
      },
      WorkAddress: {
        StreetNumber: '456',
        StreetInfo: 'Broadway Ave',
        City: 'New York',
        State: 'NY',
        Country: 'USA',
        PostalCode: '10001'
      },
      OtherAddress: {
        StreetNumber: '789',
        StreetInfo: 'Park Blvd',
        City: 'San Francisco',
        State: 'CA',
        Country: 'USA',
        PostalCode: '94101'
      }
    }
  })
});

const dynamoDBUpdateMock = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({})
});

// Mock Chime.validateE911Address() function for testing
const chimeValidateE911AddressMock = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    ValidationResult: 0,
    AddressExternalId: null,
    Address: {
      streetInfo: 'Bargene Way',
      streetNumber: '20512',
      city: 'Germantown',
      state: 'MD',
      postalCode: '20874',
      postalCodePlus4: null,
      country: 'USA'
    }
  })
});

// Mock console.log() and console.error() for testing
console.log = jest.fn();
console.error = jest.fn();

// Import the handler function from the code
const { handler } = require('./your-lambda-code');

// Unit test for GET request
test('GET request should retrieve values from DynamoDB', async () => {
  AWS.DynamoDB.DocumentClient.prototype.get = dynamoDBGetMock;
  const result = await handler(eventGet);
  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual({
    EmployeeId: '123',
    HomeAddress: {
      StreetNumber: '123',
      StreetInfo: 'Main St',
      City: 'Seattle',
      State: 'WA',
      Country: 'USA',
      PostalCode: '98101'
    },
    WorkAddress: {
      StreetNumber: '456',
      StreetInfo: 'Broadway Ave',
      City: 'New York',
      State: 'NY',
      Country: 'USA',
      PostalCode: '10001'
    },
    OtherAddress: {
      StreetNumber: '789',
      StreetInfo: 'Park Blvd',
      City: 'San Francisco',
      State: 'CA',
      Country: 'USA',
      PostalCode: '94101'
    }
  });
  expect(console.log).toHaveBeenCalledWith('GET request received for EmployeeId: 123');
  expect(console.log).toHaveBeenCalledWith('GET request successful. Retrieved item:', {
    EmployeeId: '123',
    HomeAddress: {
      StreetNumber: '123',
      StreetInfo: 'Main St',
      City: 'Seattle',
      State: 'WA',
      Country: 'USA',
      PostalCode: '98101'
    },
    WorkAddress: {
      StreetNumber: '456',
      StreetInfo: 'Broadway Ave',
      City: 'New York',
      State: 'NY',
      Country: 'USA',
      PostalCode: '10001'
    },
    OtherAddress: {
      StreetNumber: '789',
      StreetInfo: 'Park Blvd',
      City: 'San Francisco',
      State: 'CA',
      Country: 'USA',
      PostalCode: '94101'
    }
  });
});

// Unit test for POST request
test('POST request should validate addresses and update DynamoDB', async () => {
  AWS.DynamoDB.DocumentClient.prototype.get = dynamoDBGetMock;
  AWS.DynamoDB.DocumentClient.prototype.update = dynamoDBUpdateMock;
  AWS.Chime.prototype.validateE911Address = chimeValidateE911AddressMock;
  const result = await handler(eventPost);
  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual({ message: 'Update successful' });
  expect(console.log).toHaveBeenCalledWith('POST request received for EmployeeId: 123');
  expect(console.log).toHaveBeenCalledWith('Address validation completed');
  expect(console.log).toHaveBeenCalledWith('Updating addresses in DynamoDB:', {
    TableName: 'agent-contacts',
    Key: { EmployeeId: '123' },
    UpdateExpression: 'SET HomeAddress = :homeAddress, HomeCivicAddress = :homeCivicAddress, WorkAddress = :workAddress, WorkCivicAddress = :workCivicAddress, OtherAddress = :otherAddress, OtherCivicAddress = :otherCivicAddress, PreferredAddress = :preferredAddress, Email =:email',
    ExpressionAttributeValues: {
      ':homeAddress': {
        StreetNumber: '123',
        StreetInfo: 'Main St',
        City: 'Seattle',
        State: 'WA',
        Country: 'USA',
        PostalCode: '98101'
      },
      ':homeCivicAddress': {
        country: 'USA',
        RD: '123 Main St',
        A3: 'Seattle',
        PC: '98101',
        HNO: '123',
        STS: undefined,
        A1: 'WA'
      },
      ':workAddress': {
        StreetNumber: '456',
        StreetInfo: 'Broadway Ave',
        City: 'New York',
        State: 'NY',
        Country: 'USA',
        PostalCode: '10001'
      },
      ':workCivicAddress': {
        country: 'USA',
        RD: '456 Broadway Ave',
        A3: 'New York',
        PC: '10001',
        HNO: '456',
        STS: undefined,
        A1: 'NY'
      },
      ':otherAddress': {
        ValidationResult: 0,
        AddressExternalId: null,
        mappedValidateAddressResponse: {
          StreetNumber: '789',
          StreetInfo: 'Park Blvd',
          City: 'San Francisco',
          State: 'CA',
          Country: 'USA',
          PostalCode: '94101'
        }
      },
      ':otherCivicAddress': {
        country: 'USA',
        RD: '789 Park Blvd',
        A3: 'San Francisco',
        PC: '94101',
        HNO: '789',
        STS: undefined,
        A1: 'CA'
      },
      ':preferredAddress': 'home',
      ':email': 'test@example.com'
    }
  });
  expect(console.log).toHaveBeenCalledWith('Update successful');
});

// Unit test for invalid request
test('Invalid request should return error', async () => {
  const result = await handler(eventInvalid);
  expect(result.statusCode).toBe(405);
  expect(JSON.parse(result.body)).toEqual({ error: 'Method Not Allowed' });
});
