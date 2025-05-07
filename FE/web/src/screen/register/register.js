import React, { useState, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./register_style.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LanguageContext, locales } from "../../contexts/LanguageContext";
import sendConfirmationEmail from "../../API/api_register/api_sendConfirmationEmail";
import { useNavigate } from "react-router-dom";

function Register() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setrePassword] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);
  const t = locales[language];

  const validateInputs = () => {

    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error(t.invalidPhone);
      return false;
    }

    if (!/^(?!.*\.\.)[a-zA-Z0-9](\.?[a-zA-Z0-9_%+-])*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/.test(email)) {
      toast.error(t.invalidEmail);
      return false;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password)) {
      toast.error(t);
      return false;
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9 ]{2,}$/.test(userName)) {
      toast.error(t.invalidUsername);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");

    if (!validateInputs()) return;
    if (password !== repassword) {
      toast.error(t.rePass);
      return;
    }
    setLoading(true);

    // Gửi thêm password và fullName trong request
    const response = await sendConfirmationEmail(email, phoneNumber, password, userName);

    setLoading(false);

    // if (result) {
    //   toast.error("Đăng ký thành công!");
    //   setIsRegistering(false);
    // } else {
    //   toast.error("Đăng ký thất bại. Vui lòng thử lại!");
    // }

    if (response.success) {
      toast.success(response.message);
      navigate("/login");
    } else {
      setEmailError(response.message || "Đã xảy ra lỗi. Vui lòng thử lại.");

    }
  };


  return (
    <div className="container chat-container blox">
      <form className="container-fluid chat-form" onSubmit={handleSubmit}>
        <h1 className="text-center my-4 title">{t.register}</h1>

        <input
          className="form-control inp"
          type="tel"
          placeholder={t.PhoneNumber}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <input
          className={`form-control inp mt-4 ${emailError ? "is-invalid" : ""}`}
          type="email"
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError && <div className="text-danger mt-1">{emailError}</div>}

        <input
          className="form-control inp mt-4"
          type="password"
          placeholder={t.Password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="form-control inp mt-4"
          type="password"
          placeholder={t.confirmPassword}
          value={repassword}
          onChange={(e) => setrePassword(e.target.value)}
          security={true}
        />

        <input
          className="form-control inp mt-4"
          type="text"
          placeholder={t.userName}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button
          type="submit"
          className="btn btn-login btn-primary mt-4 form-control"
          disabled={loading}
        >
          {loading ? t.loadingRegister : t.register}
        </button>

        <p className="text-center mt-4">
          {t.haveAccount}{" "}
          <span
            onClick={() => navigate("/login")}
            className="link"
            style={{ cursor: "pointer", color: "blue" }}
          >
            {t.login}
          </span>
        </p>
      </form>
    </div>
  );
}

export default Register;