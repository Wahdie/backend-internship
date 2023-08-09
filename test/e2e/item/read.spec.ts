import request from "supertest";
import { createApp } from "@src/app.js";

describe("Item API", () => {
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

    // Create an item for testing read item
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

  describe("List All Items", () => {
    it("should check user is authorized", async () => {
      const response = await request(app).get("/v1/items");
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
        .get("/v1/items")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toEqual(403);
      expect(response.body.message).toBe("Forbidden Access");
    });

    it("should read data from database", async () => {
      const response = await request(app)
        .get("/v1/items")
        .set("Authorization", `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toEqual(200);
      expect(response.body.data.length).toBeGreaterThan(0);

      const item = response.body.data[0];
      expect(item._id).toBeDefined();
      expect(item.code).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.chartOfAccount).toBeDefined();
      expect(item.hasProductionNumber).toBeDefined();
      expect(item.hasExpiryDate).toBeDefined();
      expect(item.unit).toBeDefined();
      expect(item.converter).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.createdBy_id).toBeDefined();

      const pagination = response.body.pagination;
      expect(pagination.page).toEqual(1);
      expect(pagination.pageCount).toBeGreaterThanOrEqual(1);
      expect(pagination.pageSize).toEqual(10);
      expect(pagination.totalDocument).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Read Item", () => {
    it("should check user is authorized", async () => {
      const response = await request(app).get(`/v1/items/${createdItemId}`);
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
        .get(`/v1/items/${createdItemId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toEqual(403);
      expect(response.body.message).toBe("Forbidden Access");
    });

    it("should read data from database", async () => {
      const response = await request(app)
        .get(`/v1/items/${createdItemId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toEqual(200);
      const item = response.body.data;
      expect(item._id).toBeDefined();
      expect(item.code).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.chartOfAccount).toBeDefined();
      expect(item.hasProductionNumber).toBeDefined();
      expect(item.hasExpiryDate).toBeDefined();
      expect(item.unit).toBeDefined();
      expect(item.converter).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.createdBy_id).toBeDefined();
    });
  });
});
