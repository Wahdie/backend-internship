import request from "supertest";
import { createApp } from "@src/app.js";

describe("restore item", () => {
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

    // Create an item for testing restore
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

    // Archive the item for testing restore
    await request(app)
      .patch(`/v1/items/${createdItemId}/archive`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
  });

  it("should check user is authorized", async () => {
    const response = await request(app)
      .patch(`/v1/items/${createdItemId}/restore`);
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
      .patch(`/v1/items/${createdItemId}/restore`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toEqual(403);
    expect(response.body.message).toBe("Forbidden Access");
  });

  it("should restore data in database", async () => {
    const response = await request(app)
      .patch(`/v1/items/${createdItemId}/restore`)
      .set("Authorization", `Bearer ${adminAccessToken}`);

    expect(response.statusCode).toEqual(204);

    const getItemResponse = await request(app)
      .get(`/v1/items/${createdItemId}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    
    expect(getItemResponse.statusCode).toEqual(200);
    expect(getItemResponse.body.isArchived).toBe(false);
  });
});
