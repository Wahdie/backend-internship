it("should successfully delete item when user is authorized", async () => {
  const app = await createApp();

  // Authenticate admin user
  const authResponse = await request(app).post("/v1/auth/signin").send({
    username: "admin",
    password: "admin2024",
  });
  const accessToken = authResponse.body.accessToken;

  // Create item
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

    // ... other item data ...
  
  const createResponse = await request(app)
    .post("/v1/items")
    .send(data)
    .set("Authorization", `Bearer ${accessToken}`);
  const itemId = createResponse.body._id;

  // Delete item
  const deleteResponse = await request(app)
    .delete("/v1/items/" + itemId)
    .set("Authorization", `Bearer ${accessToken}`);

  // Verify status code 204 (No Content)
  expect(deleteResponse.statusCode).toEqual(204);

  // Verify item is deleted
  const verifyResponse = await request(app)
    .get("/v1/items")
    .set("Authorization", `Bearer ${accessToken}`);

  // Verify response status and data
  expect(verifyResponse.statusCode).toEqual(200);
  expect(verifyResponse.body.data.length).toBe(0);
  expect(verifyResponse.body.pagination.page).toEqual(1);
  expect(verifyResponse.body.pagination.pageCount).toEqual(0);
  expect(verifyResponse.body.pagination.pageSize).toEqual(10);
  expect(verifyResponse.body.pagination.totalDocument).toEqual(0);
});
