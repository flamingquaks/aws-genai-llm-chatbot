import { useEffect, useState } from "react";
import {
  Authenticator,
  Heading,
  ThemeProvider,
  defaultDarkModeOverride,
  useTheme,
} from "@aws-amplify/ui-react";
import App from "../app";
import { Amplify, Auth } from "aws-amplify";
import { AppConfig, UserRole } from "../common/types";
import { AppContext } from "../common/app-context";
import { UserContext, userContextDefault } from "../common/user-context";
import { Alert, StatusIndicator } from "@cloudscape-design/components";
import { StorageHelper } from "../common/helpers/storage-helper";
import { Mode } from "@cloudscape-design/global-styles";
import "@aws-amplify/ui-react/styles.css";
import { CHATBOT_NAME } from "../common/constants";


export default function AppConfigured() {
  const { tokens } = useTheme();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<boolean | null>(null);
  const [theme, setTheme] = useState(StorageHelper.getTheme());
  const [userRole, setUserRole] = useState(userContextDefault.userRole)


  // Customizing Auth SignIn Hook to Set Role
   const authenticationServices = {
    async handleSignIn(formData: { username: string; password: string; }) {
      const { username, password } = formData;
      const signIn = await Auth.signIn({
        username,
        password
      })
      setUserRole(signIn.attributes['custom:userRole'] as UserRole);
      return signIn;
    }
  }


  useEffect(() => {
    (async () => {
      try {
        const result = await fetch("/aws-exports.json");
        const awsExports = await result.json();
        const currentConfig = Amplify.configure(awsExports) as AppConfig | null;
        if (currentConfig?.config.auth_federated_provider?.auto_redirect) {
          let authenticated = false;
          try {
            const user = await Auth.currentAuthenticatedUser();
            if (user) {
              authenticated = true;
            }
          } catch (e) {
            authenticated = false;
          }

          if (!authenticated) {
            const federatedProvider =
              currentConfig.config.auth_federated_provider;

            if (!federatedProvider.custom) {
              Auth.federatedSignIn({ provider: federatedProvider.name });
            } else {
              Auth.federatedSignIn({ customProvider: federatedProvider.name });
            }
            return;
          }
        }
        setConfig(currentConfig);
        try {
          const user = await Auth.currentAuthenticatedUser();
          setUserRole(user.attributes['custom:userRole'] as UserRole);
        }catch(e){
          setUserRole(UserRole.UNDEFINED)
        }

      } catch (e) {
        console.error(e);
        setError(true);
      }
    })();
  }, []);



  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const newValue =
            document.documentElement.style.getPropertyValue(
              "--app-color-scheme"
            );

          const mode = newValue === "dark" ? Mode.Dark : Mode.Light;
          if (mode !== theme) {
            setTheme(mode);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
    };
  }, [theme]);

  if (!config) {
    if (error) {
      return (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Alert header="Configuration error" type="error">
            Error loading configuration from "
            <a href="/aws-exports.json" style={{ fontWeight: "600" }}>
              /aws-exports.json
            </a>
            "
          </Alert>
        </div>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusIndicator type="loading">Loading</StatusIndicator>
      </div>
    );
  }

  return (
    <AppContext.Provider value={config}>
      <UserContext.Provider value={{ setUserRole, userRole }}>
        <ThemeProvider
          theme={{
            name: "default-theme",
            overrides: [defaultDarkModeOverride],
          }}
          colorMode={theme === Mode.Dark ? "dark" : "light"}
        >
          <Authenticator
            hideSignUp={true}
            services={authenticationServices}
            components={{
              SignIn: {
                Header: () => {
                  return (
                    <Heading
                      padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
                      level={3}
                    >
                      {CHATBOT_NAME}
                    </Heading>
                  );
                },
              },
            }}
          >
            <App />
          </Authenticator>
        </ThemeProvider>
      </UserContext.Provider>
    </AppContext.Provider>
  );
}
