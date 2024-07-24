import MockAdapter from "axios-mock-adapter";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from 'axios';
import { BrandList } from "@ts-types/brand.t";
import { checkSyliusTokens, getOrderDetails, getOrders, getOrdersStats, getSyliusPrices, initSyliusTokens, updateOrder, updateSyliusPrices } from "./sylius";
import jwt from 'jsonwebtoken';
import { Context as KoaContext } from "koa";

const orderStatsMock = {
  "new": [
    {
      "total": "25500",
      "count": "2"
    }
  ],
  "confirmed": [
    {
      "total": "78500",
      "count": "2"
    }
  ],
  "fulfilled": [
    {
      "total": "11900",
      "count": "1"
    }
  ],
  "completed": [
    {
      "total": "23000",
      "count": "1"
    }
  ],
  "cancelled": [
    {
      "total": null,
      "count": "0"
    }
  ]
};

const orderMock = {
  "id": 2541,
  "number": "000000051",
  "serviceCenterId": "FRAC02469",
  "createdAt": "13/03/2024",
  "state": "new",
  "total": 9700,
  "countItems": 1,
  "notes": "notes update",
  "items": [
    [
      {
        "id": 4046,
        "name": "Baguette pour hayon chromée OCTAVIA COMBI",
        "code": "5E9064711A",
        "quantity": 1,
        "total": 9700,
        "image": "85/5f/8cf58eb95651902f5cb28f94f9a6.jpg",
        "variant": {
            "id": 1137,
            "code": "5E9064711A"
        }
      }
    ]
  ],
  "customer": {
      "firstName": "test",
      "lastName": "test",
      "phoneNumber": "08697642332",
      "email": "test@foo.faa",
      "street": "test",
      "postcode": "75000",
      "city": "Somewhere",
      "countryCode": "FR"
  }
};

const updateOrderPayloadMock = {
  "state": "new",
  "notes": "notes update"
};

const pricesMock = {
  '7C0017231': { vendorPriceTTC: 201 },
  '2E0017242': { vendorPriceTTC: 34 },
  '7C0017238': { vendorPriceTTC: 20 },
  '2H7071774C_041': { vendorPriceTTC: 1901 },
  '2H7071778A': { vendorPriceTTC: 550 },
  '000071128F': { vendorPriceTTC: 170 }
};
const updatePricesResponseMock =  { message: 'Prices file imported', count: 6 };

BrandList.forEach((brand) => {
  vi.stubEnv(`VITE_${brand.toUpperCase()}_SYLIUS_API_URL`, `${brand.toUpperCase()}_API_URL`);
  vi.stubEnv(`VITE_${brand.toUpperCase()}_SYLIUS_API_USERNAME`, `${brand.toUpperCase()}_API_USERNAME`);
  vi.stubEnv(`VITE_${brand.toUpperCase()}_SYLIUS_API_PASSWORD`, `${brand.toUpperCase()}_API_PASSWORD`);
})

const MockedKoaContext: KoaContext = {
  logger: {
    error: (msg: string) => {
      console.log(msg);
    }
  }
}

describe('The sylius client', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    vi.useFakeTimers();

    mock = new MockAdapter(axios);
    mock.onPost('/api/service_center/authentication-token').reply(async () => {
      return [
        200,
        { token: jwt.sign({ reason: 'Unit-Testing' }, 'my-awesome-secret', { expiresIn: '5m' }) }
      ]
    });
  })

  afterEach(() => {
    mock.reset();
    vi.useRealTimers();
  })

  afterAll(() => {
    mock.restore();
    vi.unstubAllEnvs();
  })

  it('should be able to initialize for all configured brand', async () => {
    await initSyliusTokens();

    expect(mock.history.post.length).toBe(BrandList.length);

    mock.history.post.forEach((post) => {
      expect(post.baseURL).toContain('_API_URL');
      const payload = JSON.parse(post.data);
      expect(payload.email).toContain('_API_USERNAME');
      expect(payload.password).toContain('_API_PASSWORD');
    })

    expect(checkSyliusTokens(MockedKoaContext)).toBeTruthy();
  });

  it('should be able to detect when token has expired', async () => {
    await initSyliusTokens();

    expect(mock.history.post.length).toBe(BrandList.length);

    vi.setSystemTime(Date.now() + 10 * 60 * 1000);

    expect(checkSyliusTokens(MockedKoaContext)).toBeFalsy();
  })

  it('should be able to fetch order from Sylius', async () => {
    mock.onGet('/api/service_center/FRAC02469/orders?').reply(200, []);

    const response = await getOrders('skoda', 'FRAC02469', '');

    expect(mock.history.get.length).toBe(1);
    expect(mock.history.get[0].baseURL).toBe('SKODA_API_URL');
    expect(response.data).toStrictEqual([]);
  });

  it('Should fetch order stats', async () => {
    mock.onGet('/api/service_center/FRAC02469/orders/stats').reply(200, orderStatsMock);

    const response = await getOrdersStats('skoda', 'FRAC02469');

    expect(mock.history.get.length).toBe(1);
    expect(mock.history.get[0].baseURL).toBe('SKODA_API_URL');
    expect(Object.keys(response.data)).toStrictEqual(['new', 'confirmed', 'fulfilled', 'completed', 'cancelled']);
    expect(response.data).toStrictEqual(orderStatsMock);
  });
  it('Should fetch order details', async () => {
    mock.onGet('/api/service_center/FRAC02469/order/2541').reply(200, orderMock);

    const response = await getOrderDetails('seat', 'FRAC02469', '2541');

    expect(response.data.id).toBe(2541);
    expect(response.data.serviceCenterId).toBe("FRAC02469");
    expect(response.data).toStrictEqual(orderMock);
  });

  it('Should update an order', async () => {
    mock.onPost('/api/service_center/FRAC02469/order/2541').reply(200, orderMock);

    const response = await updateOrder('seat', 'FRAC02469', '2541', updateOrderPayloadMock);

    expect(response.data.id).toBe(2541);
    expect(response.data.serviceCenterId).toBe("FRAC02469");
    expect(response.data.state).toBe("new");
    expect(response.data.notes).toBe("notes update");
    expect(response.data).toStrictEqual(orderMock);
  });

  it('Should update Sylius prices', async () => {
    mock.onPost('/api/service_center/FRAC02469/prices').reply(200, pricesMock);

    const response = await updateSyliusPrices('seat', 'FRAC02469', updatePricesResponseMock);

    expect(mock.history.post.length).toBe(1);
    expect(mock.history.post[0].baseURL).toBe('SEAT_API_URL');
    expect(response.data).toStrictEqual(pricesMock);
  });

  it('Should get Sylius prices', async () => {
    mock.onGet('/api/service_center/FRAC02469/prices').reply(200, pricesMock);

    const response = await getSyliusPrices('seat', 'FRAC02469');

    expect(mock.history.get.length).toBe(1);
    expect(mock.history.get[0].baseURL).toBe('SEAT_API_URL');
    expect(response.data).toStrictEqual(pricesMock);
  });
});
