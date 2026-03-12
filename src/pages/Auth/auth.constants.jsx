export const USER_ROLE = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  DELIVERY: "delivery",
};

export const initialRegisterForm = {
  name: "",
  phone: "",
  cep: "",
  address: "",
  district: "",
  city: "",
  state: "",
  number: "",
  complement: "",
  reference: "",
  email: "",
  password: "",
};

export const initialLoginForm = {
  email: "",
  password: "",
};

export const initialRegisterTouched = {
  name: false,
  phone: false,
  cep: false,
  address: false,
  district: false,
  city: false,
  state: false,
  number: false,
  email: false,
  password: false,
};

export const initialLoginTouched = {
  email: false,
  password: false,
};