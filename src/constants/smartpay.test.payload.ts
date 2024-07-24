export const KVPS = 'FRAC02469';
export const smartPayPaymentPayload = `{
  "merchantKey": "03fc212c-8c45-4f91-8a00-e1a698452440",
  "payment": {
      "amount": 500,
      "currencyCode": "EUR",
      "description": "Order from website"
  },
  "consumer": {
      "firstName": "Jean-Nicolas",
      "lastName": "Moal",
      "emailAddress": "jean-nicolas.moal@inventiv-it.fr"
  },
  "billingAddress": {
      "addressLine1": "A street",
      "city": "Paris",
      "postCode": "92000",
      "countryCode": "FR"
  },
  "order": {
      "externalOrderReference": "000000001",
      "lines": [
          {
              "lineNumber": 1,
              "itemArticleId": "29798723423",
              "itemName": "C\\u00e2ble MODE 2 + Nettoyeur pour c\\u00e2ble de chargement",
              "quantity": 1,
              "unitPrice": 500,
              "netAmount": 500,
              "vatPercent": 0,
              "vatAmount": 0,
              "grossAmount": 0
          }
      ]
  },
  "customReferences": {
    "custom1": "skoda"
  }
}`;
