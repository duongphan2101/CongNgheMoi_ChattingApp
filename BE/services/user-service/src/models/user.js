class User {
    constructor(phoneNumber, email, fullName, password, userID) {
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.fullName = fullName;
        this.password = password;
        this.userID = userID;
        
        // Các trường có giá trị mặc định
        this.avatar = '';
        this.createAt = new Date().toISOString();
        this.dob = null;
        this.friends = [];
        this.gender = null;
        this.status = 'active';
    }
}

module.exports = User;