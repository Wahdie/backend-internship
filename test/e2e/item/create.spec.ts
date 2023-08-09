import request from "supertest";
import { createApp } from "@src/app.js";

describe("create item", () => {
  let app;
  let adminAccessToken;

  beforeAll(async () => {
    app = await createApp();

    // Authenticate admin user
    const adminAuthResponse = await request(app).post("/v1/auth/signin").send({
      username: "admin",
      password: "admin2024",
    });
    adminAccessToken = adminAuthResponse.body.accessToken;
  });

  it("should check user is authorized", async () => {
    const response = await request(app).post("/v1/items").send({});

    expect(response.statusCode).toEqual(401);
    expect(response.body.message).toBe("Unauthorized Access");
  });

  it("should check user have permission to access", async () => {
    // Authenticate regular user
    const authResponse = await request(app).post("/v1/auth/signin").send({
      username: "user",
      password: "user2024",
    });
    const accessToken = authResponse.body.accessToken;

    const response = await request(app).post("/v1/items").send({}).set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toEqual(403);
    expect(response.body.message).toBe("Forbidden Access");
  });

  it("should check required fields", async () => {
    const response = await request(app).post("/v1/items").send({}).set("Authorization", `Bearer ${adminAccessToken}`);

    expect(response.statusCode).toEqual(422);
    expect(response.body.message).toBe("Unprocessable Entity");
    expect(response.body.errors).toHaveProperty("name");
    expect(response.body.errors).toHaveProperty("chartOfAccount");
    expect(response.body.errors).toHaveProperty("unit");
  });

  it("should check unique fields", async () => {
    const data = {
      code: "A1",
      name: "item A",
      chartOfAccount: "Goods",
      hasProductionNumber: true,
      hasExpiryDate: false,
      unit: "pcs",
      converter: [
        {
          name: "dozen",
          multiply: 12,
        },
      ],
    };

    await request(app).post("/v1/items").send(data).set("Authorization", `Bearer ${adminAccessToken}`);

    const response = await request(app).post("/v1/items").send(data).set("Authorization", `Bearer ${adminAccessToken}`);

    expect(response.statusCode).toEqual(422);
    expect(response.body.message).toBe("Unprocessable Entity");
    expect(response.body.errors).toHaveProperty("code");
    expect(response.body.errors).toHaveProperty("name");
  });

  it("should save to database", async () => {
    const data = {
      code: "A1",
      name: "item A",
      chartOfAccount: "Goods",
      hasProductionNumber: true,
      hasExpiryDate: false,
      unit: "pcs",
      converter: [
        {
          name: "dozen",
          multiply: 12,
        },
      ],
    };

    const response = await request(app).post("/v1/items").send(data).set("Authorization", `Bearer ${adminAccessToken}`);

    expect(response.statusCode).toEqual(201);
    expect(response.body._id).not.toBeNull();

    const getItemResponse = await request(app)
      .get(`/v1/items/${response.body._id}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);

    expect(getItemResponse.statusCode).toEqual(200);
    const result = getItemResponse.body;
    expect(result.code).toEqual(data.code);
    expect(result.name).toEqual(data.name);
    expect(result.chartOfAccount).toEqual(data.chartOfAccount);
    expect(result.hasProductionNumber).toEqual(data.hasProductionNumber);
    expect(result.hasExpiryDate).toEqual(data.hasExpiryDate);
    expect(result.unit).toEqual(data.unit);
    expect(result.converter).toEqual(data.converter);
    expect(result.createdBy_id).toBe(adminAccessToken.user._id);
  });
});
