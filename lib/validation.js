// Shared by the browser forms AND the API routes (server-side re-validation).

export const PK_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad",
  "Gujranwala", "Sialkot", "Sargodha", "Bahawalpur", "Sukkur", "Abbottabad", "Mardan", "Sheikhupura", "Rahim Yar Khan",
  "Gujrat", "Sahiwal", "Okara", "Jhelum", "Larkana", "Mirpur (AJK)", "Muzaffarabad", "Dera Ghazi Khan",
];

export const emptyCustomer = { customer_name: "", phone: "", email: "", city: "", address: "", notes: "" };

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(phone = "") {
  return String(phone).replace(/[\s-]/g, "");
}

export function validateCustomer(c = {}, { requireEmail = false } = {}) {
  const errors = {};
  const name = String(c.customer_name || "").trim();
  const email = String(c.email || "").trim();
  if (name.length < 2) errors.customer_name = "Please enter your full name";
  if (!/^(\+92|0092|92|0)?3\d{9}$/.test(normalizePhone(c.phone))) errors.phone = "Enter a valid mobile number, e.g. 03XX XXXXXXX";
  if (requireEmail && !email) errors.email = "Email is required";
  if (email && !EMAIL_RE.test(email)) errors.email = "Enter a valid email";
  if (!String(c.city || "").trim()) errors.city = "Please enter your city";
  if (String(c.address || "").trim().length < 8) errors.address = "Please enter your complete address";
  return errors;
}
