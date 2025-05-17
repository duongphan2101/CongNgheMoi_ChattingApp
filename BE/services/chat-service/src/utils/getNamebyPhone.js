const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function getFullName(phoneNumber) {
  if (!phoneNumber) return null;

  try {
    const { Item } = await dynamoDB
      .get({
        TableName: "Users",          // đổi tên bảng nếu khác
        Key: { phoneNumber: phoneNumber },
        ProjectionExpression: "fullName",
      })
      .promise();

    return Item ? Item.fullName : null;
  } catch (err) {
    console.error("getFullName error:", err);
    return null;
  }
}

module.exports = getFullName;
