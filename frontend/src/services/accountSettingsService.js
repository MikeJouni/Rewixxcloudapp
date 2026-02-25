import Backend from "../Backend";

export const getAccountSettings = () => {
  return Backend.get("api/account-settings");
};

export const updateAccountSettings = (settings) => {
  return Backend.put("api/account-settings", settings);
};
