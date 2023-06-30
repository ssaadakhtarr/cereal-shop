const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const serialize = require("node-serialize");
const NodeRSA = require("node-rsa");
const fs = require("fs");

const app = express();
app.set("view engine", "ejs");

// cookieParser middleware
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use((req, res, next) => {
  res.locals.error = null;
  res.locals.success = null;
  next();
});

// Create a new NodeRSA instance
const key = new NodeRSA();

const publicKey = fs.readFileSync("public.pem", "utf8");

// Load the private key
const privateKey = fs.readFileSync("private.pem", "utf8");

key.importKey(publicKey, "public");
key.importKey(privateKey, "private");

app.locals.users = {
  admin: "REDACTED",
};

const products = [
  {
    id: 1,
    name: "Nike Air Zoom G.T.",
    price: 100,
    image: "/images/product1.png",
  },
  {
    id: 2,
    name: "Nike Air Max 270",
    price: 150,
    image: "/images/product2.png",
  },
  {
    id: 3,
    name: "Nike Revolution 6",
    price: 120,
    image: "/images/product3.png",
  },
  {
    id: 4,
    name: "Nike Air Max Genome",
    price: 125,
    image: "/images/product4.png",
  },
  {
    id: 5,
    name: "Nike Air Max Impact 4",
    price: 130,
    image: "/images/product5.png",
  },
  {
    id: 6,
    name: "Nike Air Max Impact 3",
    price: 135,
    image: "/images/product6.png",
  },
];

function authenticateUser(username, password) {
  const { users } = app.locals;
  if (users[username] === password) {
    return true;
  }
  return false;
}

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Define the login endpoint for handling form submission
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (authenticateUser(username, password)) {
    const jwtToken = jwt.sign({ username }, "REDACTED", { algorithm: "HS256" });
    res.cookie("JWT", jwtToken);
    res.redirect("/dashboard");
  } else {
    res.render("login", { error: "Invalid username or password" });
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null, success: null });
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const { users } = app.locals;
  if (username in users) {
    res.render("register", { error: "Username already taken", success: null });
  } else {
    users[username] = password;
    res.render("register", { error: null, success: "Registration successful" });
  }
});

app.get("/dashboard", (req, res) => {
  const token = req.cookies && req.cookies.JWT;

  try {
    if (!token) {
      throw new Error("Invalid token");
    }
    const payload = jwt.verify(token, "REDACTED");
    const username = payload.username;
    res.render("dashboard", { username, products });
  } catch (err) {
    res.redirect("/login");
  }
});

app.post("/add-to-cart", (req, res) => {
  const productId = req.body.productId;
  const product = products.find((p) => p.id === parseInt(productId));

  if (product) {
    const cartData = req.cookies && req.cookies.cart;
    let cartItems = {};

    if (cartData) {
      
      const decryptedCart = key.decrypt(cartData, "utf-8");

      cartItems = serialize.unserialize(decryptedCart);
      
    }

    cartItems[product.id] = product;

    const serializedCart = serialize.serialize(cartItems);

    const encryptedEncodedCart = key.encrypt(serializedCart, "base64"); // Encrypt the cart cookie
   

    res.cookie("cart", encryptedEncodedCart);
  }

  res.redirect("/dashboard");
});

app.post("/buy", (req, res) => {
  // Fetch the cart data from the cookie
  const cartData = req.cookies && req.cookies.cart;
  let cartItems = {};
  const token = req.cookies && req.cookies.JWT;
  try {
    if (!token) {
      throw new Error("Invalid token");
    }
    const payload = jwt.verify(token, "REDACTED");
    const username = payload.username;

    res.clearCookie("cart");
    res.render("orderConfirmation");
  } catch (err) {
    res.redirect("/login");
  }
});

app.get("/checkout", (req, res) => {
  try {
    const encryptedCartData = req.cookies && req.cookies.cart;
    if (!encryptedCartData) {
      throw new Error("Cart data not found");
    }

    const decodedCartData = key.decrypt(encryptedCartData, "utf8"); // Decrypt the cart cookie

    const cartItems = serialize.unserialize(decodedCartData);

    // ...

    res.render("checkout", { cartItems });
  } catch (err) {
    // Handle decryption or other errors
    res.redirect("/dashboard");
  }
});

app.post("/clear-cart", (req, res) => {
  res.clearCookie("cart");
  res.redirect("/dashboard");
});

app.post("/logout", (req, res) => {
  res.clearCookie("JWT");
  res.clearCookie("cart");
  res.redirect("/login");
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
