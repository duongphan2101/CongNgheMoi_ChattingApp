import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import sendLinkReset from "../../API/api_sendLinkReset"; // Import the sendLinkReset function
import { LanguageContext, locales } from "../../contexts/LanguageContext";
import { toast } from "react-toastify";
function SendLinkReset() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const { language } = useContext(LanguageContext);
  const t = locales[language];

  const validatePhoneNumber = () => {
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error(t.invalidPhone);
      return false;
    }
    return true;
  };

  const handleSendLink = async () => {
    if (!validatePhoneNumber()) return;

    setLoading(true);
    try {
      await sendLinkReset(phoneNumber); // Call the sendLinkReset function
      setSuccess(true);
    } catch (error) {
      toast.error(t.linkSetPassError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const success = urlParams.get("success");
    if (success) {
      setSuccess(true);
    }
  }, [location.search]);

  return (
    <div className="container chat-container blox">
      {success ? (
        <div className="alert alert-success" role="alert">
          {t.linkSetPassEmail}
        </div>
      ) : (
        <form className="container-fluid chat-form" onSubmit={(e) => e.preventDefault()}>
          <h1 className="text-center my-4 title">{t.forgotPassword}</h1>

          <div className="input-group mb-4">
            <input
              className="form-control inp"
              type="text"
              placeholder={t.PhoneNumber}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleSendLink}
              disabled={loading}
            >
              {loading ? t.linkding : t.sendResetLink}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SendLinkReset;