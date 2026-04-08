export default function MembeeLogin() {
    const go = (token: string) => {
      window.location.href = `/auth/membee/callback?Token=${encodeURIComponent(
        token
      )}`;
    };
  
    return (
      <div style={{ padding: 40, maxWidth: 900 }}>
        <h1>Login (Membee SSO)</h1>
  
        <p>
          For capstone demo: use simulated SSO tokens. In production, this page
          embeds Membee’s login widget and redirects back with a real Token.
        </p>
  
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <button onClick={() => go("DEV_APPLICANT")}>Simulate Applicant SSO</button>
          <button onClick={() => go("DEV_OFFICE")}>Simulate Office SSO</button>
          <button onClick={() => go("DEV_EDU_REVIEWER")}>
            Simulate Education Reviewer SSO
          </button>
          <button onClick={() => go("DEV_EXP_REVIEWER")}>
            Simulate Experience Reviewer SSO
          </button>
        </div>
  
        <hr style={{ margin: "24px 0" }} />
  
        <h3>Production (later)</h3>
        <p>
          When CIPS provides ClientID/AppID/APIKey + trusted domain, we will embed
          the Membee login iframe here.
        </p>
      </div>
    );
  }       