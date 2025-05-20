const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function getInfo(phoneNumber) {
  if (!phoneNumber) return null;

  try {
    const { Item } = await dynamoDB
      .get({
        TableName: "Users", // Đổi nếu bảng tên khác
        Key: { phoneNumber: phoneNumber },
        // Bỏ ProjectionExpression để lấy toàn bộ thông tin
      })
      .promise();

    return Item || null;
  } catch (err) {
    console.error("getInfo error:", err);
    return null;
  }
}

module.exports = getInfo;

