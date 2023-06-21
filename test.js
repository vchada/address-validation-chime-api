import { handler } from './index';

describe('E911 Address Validation Lambda', () => {
  it('should return valid address response', async () => {
    const event = {
      AwsAccountId: '123456789',
      StreetNumber: '123',
      StreetInfo: 'Main Street',
      City: 'City',
      State: 'State',
      Country: 'Country',
      PostalCode: '12345'
    };

    const response = await handler(event, null);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('Valid', true);
  });

  it('should return error response for missing required parameter', async () => {
    const event = {
      StreetNumber: '123',
      StreetInfo: 'Main Street',
      City: 'City',
      State: 'State',
      Country: 'Country',
      PostalCode: '12345'
    };

    const response = await handler(event, null);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toHaveProperty(
      'error',
      'Missing required key \'AwsAccountId\' in params'
    );
  });

  it('should return error response for API error', async () => {
    const event = {
      AwsAccountId: '123456789',
      StreetNumber: '123',
      StreetInfo: 'Main Street',
      City: 'City',
      State: 'InvalidState',
      Country: 'Country',
      PostalCode: '12345'
    };

    const response = await handler(event, null);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toHaveProperty(
      'error',
      'InvalidState is not a valid state'
    );
  });
});
