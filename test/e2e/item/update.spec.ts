import request from "supertest";
import { createApp } from "@src/app.js";

describe("update item", () => {
  let app;
  let adminAccessToken;
  let createdItemId;

  beforeAll(async () => {
    app = await createApp();

    // Authenticate admin user
    const authResponse = await request(app)
      .post("/v1/auth/signin")
      .send({
        username: "admin",
        password: "admin2024",
      });
    adminAccessToken = authResponse.body.accessToken;

    // Create an item for testing update
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
    const createResponse = await request(app)
      .post("/v1/items")
      .send(data)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    createdItemId = createResponse.body._id;
  });

  it("should check user is authorized", async () => {
    const response = await request(app)
      .patch(`/v1/items/${createdItemId}`)
      .send({});
    expect(response.statusCode).toEqual(401);
    expect(response.body.message).toBe("Unauthorized Access");
  });

  it("should check user have permission to access", async () => {
    // Authenticate regular user
    const authResponse = await request(app)
      .post("/v1/auth/signin")
      .send({
        username: "user",
        password: "user2024",
      });
    const accessToken = authResponse.body.accessToken;

    const response = await request(app)
      .patch(`/v1/items/${createdItemId}`)
      .send({})
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toEqual(403);
    expect(response.body.message).toBe("Forbidden Access");
  });

  it("should check required fields", async () => {
    const response = await request(app)
      .patch(`/v1/items/${createdItemId}`)
      .send({})
      .set("Authorization", `Bearer ${adminAccessToken}`);

    expect(response.statusCode).toEqual(422);
    expect(response.body.message).toBe("Unprocessable Entity");
    expect(response.body.errors.name).toContain("name is required");
    expect(response.body.errors.chartOfAccount).toContain("chart of account is required");
    expect(response.body.errors.unit).toContain("unit is required");
  });

  it("should check unique fields", async () => {
    // Update the item with duplicate values
    const data = {
      code: "A1",
      name: "item A",
    };
    const response = await request(app)
      .patch(`/v1/items/${createdItemId}`)
      .send(data)
      .set("Authorization", `Bearer ${adminAccessToken}`);

    expect(response.statusCode).toEqual(422);
    expect(response.body.message).toBe("Unprocessable Entity");
    expect(response.body.errors.code).toContain("code is exists");
    expect(response.body.errors.name).toContain("name is exists");
  });

  it("should update data in database", async () => {
    const data = {
      name: "item AAA",
    };
    const response = await request(app)
      .patch(`/v1/items/${createdItemId}`)
      .send(data)
      .set("Authorization", `Bearer ${adminAccessToken}`);

    expect(response.statusCode).toEqual(204);

    const getItemResponse = await request(app)
      .get(`/v1/items/${createdItemId}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    
    expect(getItemResponse.statusCode).toEqual(200);
    expect(getItemResponse.body.data.name).toEqual("item AAA");
    expect(getItemResponse.body.data.updatedAt).toBeTruthy();
    expect(getItemResponse.body.data.updatedBy_id).toBe(adminAccessToken);
  });
});
