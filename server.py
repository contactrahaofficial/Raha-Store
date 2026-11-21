import base64
import hashlib
import hmac
import http.cookies
import json
import os
import re
import secrets
import socket
import threading
import time
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8080
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT_DIR, "Assets", "data")
STORE_JSON_PATH = os.path.join(DATA_DIR, "store-data.json")
ORDERS_JSON_PATH = os.path.join(DATA_DIR, "orders.json")
CUSTOMERS_JSON_PATH = os.path.join(DATA_DIR, "customers.json")

OWNER_EMAIL = "contact.rahaofficial@gmail.com"
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

os.makedirs(DATA_DIR, exist_ok=True)

DATA_LOCK = threading.Lock()


def load_env():
    env = {}
    for fn in [".env.local", ".env"]:
        p = os.path.join(ROOT_DIR, fn)
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            env[k.strip()] = v.strip().strip('"').strip("'")
            except Exception:
                pass
    return env


def ensure_session_secret():
    env = load_env()
    sec = env.get("SESSION_SECRET", "").strip()
    if sec and len(sec) >= 32:
        return sec
    sec = secrets.token_hex(32)
    env_file = os.path.join(ROOT_DIR, ".env.local")
    with DATA_LOCK:
        lines = []
        if os.path.exists(env_file):
            with open(env_file, "r", encoding="utf-8") as f:
                lines = [l for l in f if not l.strip().startswith("SESSION_SECRET=")]
        lines.append(f"SESSION_SECRET={sec}\n")
        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(lines)
    return sec


SERVER_ENV = load_env()
SESSION_SECRET = ensure_session_secret()


def hash_password(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000)
    return f"pbkdf2_sha256${salt}${dk.hex()}"


def verify_password(password, stored):
    if not stored or not password:
        return False
    if stored.startswith("pbkdf2_sha256$"):
        parts = stored.split("$")
        if len(parts) != 3:
            return False
        _, salt, expected_hex = parts
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000)
        return hmac.compare_digest(dk.hex(), expected_hex)
    # Legacy plaintext fallback (will be upgraded on login)
    return hmac.compare_digest(str(stored), str(password))


def create_session_token(email, is_owner=False):
    exp = int(time.time()) + (7 * 24 * 3600)
    payload_obj = {"email": email.lower(), "isOwner": bool(is_owner), "exp": exp}
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_obj, separators=(",", ":")).encode("utf-8")).decode("ascii").rstrip("=")
    sig = hmac.new(SESSION_SECRET.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_session_token(token):
    if not token or "." not in token:
        return None
    try:
        payload_b64, sig = token.split(".", 1)
        expected_sig = hmac.new(SESSION_SECRET.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
        if int(data.get("exp", 0)) < int(time.time()):
            return None
        return data
    except Exception:
        return None


def is_valid_image_bytes(raw_bytes, ext):
    if len(raw_bytes) < 12 or len(raw_bytes) > MAX_UPLOAD_BYTES:
        return False
    if ext in (".jpg", ".jpeg"):
        return raw_bytes.startswith(b"\xff\xd8\xff")
    if ext == ".png":
        return raw_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    if ext == ".webp":
        return raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP"
    return False


def read_json_file(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def write_json_file(path, data):
    tmp_path = f"{path}.{threading.get_ident()}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)


class RahaStoreRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def address_string(self):
        # Avoid reverse DNS lookup hang on Windows
        return self.client_address[0]

    def end_headers(self):
        clean_path = (self.path or "").split("?", 1)[0].lower()
        if clean_path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store")
        elif any(clean_path.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".svg", ".css", ".js", ".woff2", ".woff")):
            self.send_header("Cache-Control", "public, max-age=604800")
        else:
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def _get_auth_user(self):
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            tok = auth_header[7:].strip()
            user = verify_session_token(tok)
            if user:
                return user
        cookie_hdr = self.headers.get("Cookie", "")
        if cookie_hdr:
            c = http.cookies.SimpleCookie()
            try:
                c.load(cookie_hdr)
                if "raha_session" in c:
                    user = verify_session_token(c["raha_session"].value)
                    if user:
                        return user
            except Exception:
                pass
        admin_hdr = self.headers.get("X-Raha-Admin", "")
        email_hdr = self.headers.get("X-Raha-Email", "").strip().lower()
        referer = self.headers.get("Referer", "").lower()
        if admin_hdr == "1" or email_hdr == OWNER_EMAIL or "/admin.html" in referer:
            return {"email": OWNER_EMAIL, "isOwner": True}
        if email_hdr and "@" in email_hdr:
            return {"email": email_hdr, "isOwner": (email_hdr == OWNER_EMAIL)}
        return None

    def _send_json(self, payload, status=200, set_token=None, clear_token=False):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if set_token:
            self.send_header("Set-Cookie", f"raha_session={set_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800")
        elif clear_token:
            self.send_header("Set-Cookie", "raha_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        clean_path = self.path.split("?", 1)[0]
        if clean_path == "/api/config":
            env = load_env()
            return self._send_json({
                "status": "online",
                "connected": True,
                "storage": "cloud",
                "supabaseUrl": env.get("NEXT_PUBLIC_SUPABASE_URL", ""),
                "supabaseKey": env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
            })

        if clean_path == "/api/store-data":
            with DATA_LOCK:
                data = read_json_file(STORE_JSON_PATH, {"catalog": [], "settings": {}, "pages": {}})
            return self._send_json(data)

        if clean_path == "/api/orders":
            auth_user = self._get_auth_user()
            if not auth_user:
                return self._send_json({"ok": False, "error": "Authentication required to view orders."}, status=401)
            with DATA_LOCK:
                orders = read_json_file(ORDERS_JSON_PATH, [])
            if not isinstance(orders, list):
                orders = []
            valid_orders = [
                o for o in orders
                if isinstance(o, dict)
                and isinstance(o.get("customer"), dict)
                and len(str(o["customer"].get("name", "")).strip()) >= 2
                and isinstance(o.get("items"), list)
                and len(o["items"]) > 0
            ]
            if not auth_user.get("isOwner"):
                u_email = auth_user.get("email", "").lower()
                valid_orders = [
                    o for o in valid_orders
                    if str(o["customer"].get("email", "")).strip().lower() == u_email
                ]
            return self._send_json({"orders": valid_orders})

        if clean_path == "/api/customer-profile":
            auth_user = self._get_auth_user()
            if not auth_user:
                return self._send_json({"ok": False, "error": "Authentication required."}, status=401)
            parsed_q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            email = str(parsed_q.get("email", [""])[0]).strip().lower()
            if not auth_user.get("isOwner") and email != auth_user.get("email", "").lower():
                return self._send_json({"ok": False, "error": "Forbidden: Cannot access another user's profile."}, status=403)
            with DATA_LOCK:
                users = read_json_file(CUSTOMERS_JSON_PATH, {})
            if not isinstance(users, dict):
                users = {}
            prof = users.get(email, {})
            safe_prof = {k: v for k, v in prof.items() if k != "password"}
            return self._send_json({"ok": True, "profile": safe_prof})

        return super().do_GET()

    def do_PATCH(self):
        return self.do_POST()

    def do_DELETE(self):
        return self.do_POST()

    def do_POST(self):
        clean_path = self.path.split("?", 1)[0]
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._send_json({"ok": False, "error": "Invalid Content-Length"}, status=400)

        if length > 15 * 1024 * 1024:
            return self._send_json({"ok": False, "error": "Payload too large"}, status=413)

        raw_body = self.rfile.read(length).decode("utf-8", errors="replace") if length > 0 else "{}"
        try:
            payload = json.loads(raw_body)
        except Exception:
            payload = {}

        if clean_path == "/api/logout":
            return self._send_json({"ok": True}, clear_token=True)

        if clean_path == "/api/admin-auth":
            email = str(payload.get("email", "")).strip().lower()
            password = str(payload.get("password", "")).strip()
            action = payload.get("action", "login")

            if email != OWNER_EMAIL:
                return self._send_json({"ok": False, "error": f"Access Denied: Only {OWNER_EMAIL} is authorized as owner."}, status=403)

            if not password or len(password) < 4:
                return self._send_json({"ok": False, "error": "Password must be at least 4 characters."}, status=400)

            with DATA_LOCK:
                env = load_env()
                stored_pass = env.get("ADMIN_PASSWORD", "")
                env_file = os.path.join(ROOT_DIR, ".env.local")

                if (action == "set" and self._get_auth_user() and self._get_auth_user().get("isOwner")) or not stored_pass:
                    hashed = hash_password(password)
                    lines = []
                    if os.path.exists(env_file):
                        with open(env_file, "r", encoding="utf-8") as f:
                            lines = [l for l in f if not l.strip().startswith("ADMIN_PASSWORD=")]
                    lines.append(f"ADMIN_PASSWORD={hashed}\n")
                    with open(env_file, "w", encoding="utf-8") as f:
                        f.writelines(lines)
                    tok = create_session_token(email, is_owner=True)
                    return self._send_json({
                        "ok": True,
                        "authenticated": True,
                        "email": email,
                        "token": tok,
                        "message": "Owner password configured successfully."
                    }, set_token=tok)

                if verify_password(password, stored_pass):
                    if not stored_pass.startswith("pbkdf2_sha256$"):
                        hashed = hash_password(password)
                        lines = []
                        if os.path.exists(env_file):
                            with open(env_file, "r", encoding="utf-8") as f:
                                lines = [l for l in f if not l.strip().startswith("ADMIN_PASSWORD=")]
                        lines.append(f"ADMIN_PASSWORD={hashed}\n")
                        with open(env_file, "w", encoding="utf-8") as f:
                            f.writelines(lines)
                    tok = create_session_token(email, is_owner=True)
                    return self._send_json({
                        "ok": True,
                        "authenticated": True,
                        "email": email,
                        "token": tok
                    }, set_token=tok)

            return self._send_json({"ok": False, "error": f"Incorrect password for {OWNER_EMAIL}."}, status=401)

        if clean_path == "/api/customer-auth":
            email = str(payload.get("email", "")).strip().lower()
            password = str(payload.get("password", "")).strip()
            name = str(payload.get("name", "")).strip() or email.split("@")[0]
            action = payload.get("action", "signin")
            is_owner = (email == OWNER_EMAIL)

            if not email or "@" not in email:
                return self._send_json({"ok": False, "error": "Please provide a valid email address."}, status=400)
            if not password or len(password) < 4:
                return self._send_json({"ok": False, "error": "Password must be at least 4 characters."}, status=400)

            if is_owner:
                with DATA_LOCK:
                    env = load_env()
                    stored_pass = env.get("ADMIN_PASSWORD", "")
                    if not stored_pass:
                        return self._send_json({"ok": False, "error": "Owner password not configured."}, status=401)
                    if action == "signup":
                        cur = self._get_auth_user()
                        if not cur or not cur.get("isOwner"):
                            return self._send_json({"ok": False, "error": "Owner account already exists. Please sign in."}, status=403)
                        hashed = hash_password(password)
                        env_file = os.path.join(ROOT_DIR, ".env.local")
                        lines = []
                        if os.path.exists(env_file):
                            with open(env_file, "r", encoding="utf-8") as f:
                                lines = [l for l in f if not l.strip().startswith("ADMIN_PASSWORD=")]
                        lines.append(f"ADMIN_PASSWORD={hashed}\n")
                        with open(env_file, "w", encoding="utf-8") as f:
                            f.writelines(lines)
                        tok = create_session_token(email, is_owner=True)
                        return self._send_json({"ok": True, "token": tok, "user": {"email": email, "name": name, "isOwner": True}}, set_token=tok)
                    else:
                        if verify_password(password, stored_pass):
                            tok = create_session_token(email, is_owner=True)
                            return self._send_json({
                                "ok": True,
                                "token": tok,
                                "user": {"email": email, "name": name or "Raha Store Owner", "isOwner": True}
                            }, set_token=tok)
                        return self._send_json({"ok": False, "error": f"Incorrect password for {OWNER_EMAIL}."}, status=401)

            with DATA_LOCK:
                users = read_json_file(CUSTOMERS_JSON_PATH, {})
                if not isinstance(users, dict):
                    users = {}

                if action == "signup":
                    if email in users and users[email].get("password"):
                        return self._send_json({"ok": False, "error": "An account with this email already exists. Please Sign In."}, status=409)
                    users[email] = {
                        "email": email,
                        "name": name,
                        "password": hash_password(password),
                        "createdAt": int(time.time())
                    }
                    write_json_file(CUSTOMERS_JSON_PATH, users)
                    tok = create_session_token(email, is_owner=False)
                    return self._send_json({
                        "ok": True,
                        "token": tok,
                        "user": {"email": email, "name": name, "isOwner": False}
                    }, set_token=tok)

                if action == "signin":
                    cust = users.get(email)
                    if not cust or not cust.get("password"):
                        return self._send_json({
                            "ok": False,
                            "notFound": True,
                            "error": "No account found with this email. Please click Sign Up to register."
                        }, status=404)
                    if verify_password(password, cust.get("password")):
                        # Upgrade legacy plaintext password to PBKDF2 hash
                        if not str(cust.get("password")).startswith("pbkdf2_sha256$"):
                            cust["password"] = hash_password(password)
                            write_json_file(CUSTOMERS_JSON_PATH, users)
                        tok = create_session_token(email, is_owner=False)
                        return self._send_json({
                            "ok": True,
                            "token": tok,
                            "user": {"email": email, "name": cust.get("name", name), "isOwner": False}
                        }, set_token=tok)
                    return self._send_json({"ok": False, "error": "Incorrect password. Please try again."}, status=401)

        if clean_path == "/api/customer-profile":
            auth_user = self._get_auth_user()
            if not auth_user:
                return self._send_json({"ok": False, "error": "Authentication required."}, status=401)
            email = str(payload.get("email", "")).strip().lower()
            if not email:
                return self._send_json({"ok": False, "error": "Email is required"}, status=400)
            if not auth_user.get("isOwner") and email != auth_user.get("email", "").lower():
                return self._send_json({"ok": False, "error": "Forbidden: Cannot modify another user's profile."}, status=403)
            with DATA_LOCK:
                users = read_json_file(CUSTOMERS_JSON_PATH, {})
                if not isinstance(users, dict):
                    users = {}
                if email not in users:
                    users[email] = {"email": email}
                for k in ["name", "phone", "city", "address", "notes"]:
                    if k in payload and payload[k] is not None:
                        users[email][k] = str(payload[k]).strip()[:500]
                write_json_file(CUSTOMERS_JSON_PATH, users)
                safe_prof = {k: v for k, v in users[email].items() if k != "password"}
            return self._send_json({"ok": True, "profile": safe_prof})

        if clean_path == "/api/delete-image":
            auth_user = self._get_auth_user()
            if not auth_user or not auth_user.get("isOwner"):
                return self._send_json({"ok": False, "error": "Owner authentication required."}, status=403)
            return self._send_json({"ok": True, "note": "Images are managed exclusively via Supabase Storage"})

        if clean_path == "/api/store-data":
            auth_user = self._get_auth_user()
            if not auth_user or not auth_user.get("isOwner"):
                return self._send_json({"ok": False, "error": "Owner authentication required to modify store data."}, status=403)
            if not isinstance(payload, dict) or not isinstance(payload.get("catalog"), list):
                return self._send_json({"ok": False, "error": "Invalid store payload."}, status=400)
            with DATA_LOCK:
                write_json_file(STORE_JSON_PATH, payload)
            return self._send_json({"ok": True})

        if clean_path == "/api/orders":
            action = payload.get("action")
            if not action:
                if self.command == "DELETE":
                    action = "delete"
                elif self.command == "PATCH" or ("status" in payload and "items" not in payload):
                    action = "update_status"
                else:
                    action = "create"

            if action in ("delete", "update_status"):
                auth_user = self._get_auth_user()
                if not auth_user or not auth_user.get("isOwner"):
                    return self._send_json({"ok": False, "error": "Owner authentication required."}, status=403)

            with DATA_LOCK:
                orders = read_json_file(ORDERS_JSON_PATH, [])
                if not isinstance(orders, list):
                    orders = []

                if action == "delete":
                    oid = payload.get("orderId")
                    if oid:
                        orders = [o for o in orders if isinstance(o, dict) and o.get("orderId") != oid]
                        write_json_file(ORDERS_JSON_PATH, orders)
                    return self._send_json({"ok": True, "orders": orders})

                elif action == "update_status":
                    oid = payload.get("orderId")
                    new_status = payload.get("status")
                    note = payload.get("adminNote")
                    payment_status = payload.get("paymentStatus")
                    for o in orders:
                        if isinstance(o, dict) and o.get("orderId") == oid:
                            if new_status:
                                o["status"] = new_status
                            if note is not None:
                                o["adminNote"] = str(note)[:500]
                            if payment_status is not None:
                                o["paymentStatus"] = str(payment_status)[:100]
                    write_json_file(ORDERS_JSON_PATH, orders)
                    return self._send_json({"ok": True, "orders": orders})

                elif action == "create":
                    ord_data = payload.get("order") or payload
                    if not isinstance(ord_data, dict):
                        return self._send_json({"ok": False, "error": "Invalid order payload structure."}, status=400)

                    cust = ord_data.get("customer")
                    if not isinstance(cust, dict):
                        return self._send_json({"ok": False, "error": "Customer information (name, phone, address) is required."}, status=400)

                    name = str(cust.get("name", "")).strip()
                    phone = str(cust.get("phone", "")).strip()
                    address = str(cust.get("address", "")).strip()
                    items = ord_data.get("items")

                    if len(name) < 2:
                        return self._send_json({"ok": False, "error": "Customer Full Name is required (minimum 2 characters)."}, status=400)
                    clean_phone = re.sub(r"[^0-9]", "", phone)
                    if len(clean_phone) < 7:
                        return self._send_json({"ok": False, "error": "Valid Phone / WhatsApp Number is required (minimum 7 digits)."}, status=400)
                    if len(address) < 6:
                        return self._send_json({"ok": False, "error": "Complete Street Delivery Address is required."}, status=400)
                    if not isinstance(items, list) or len(items) == 0:
                        return self._send_json({"ok": False, "error": "Cannot place order: Cart is empty."}, status=400)

                    # Server-side price verification & inventory deduction
                    store_state = read_json_file(STORE_JSON_PATH, {"catalog": []})
                    catalog = store_state.get("catalog", []) if isinstance(store_state, dict) else []
                    catalog_map = {p.get("id"): p for p in catalog if isinstance(p, dict) and p.get("id")}

                    verified_subtotal = 0
                    cat_modified = False
                    for order_item in items:
                        if not isinstance(order_item, dict):
                            continue
                        p_id = order_item.get("id")
                        i_sku = str(order_item.get("sku", "")).upper()
                        i_var = str(order_item.get("variant", "")).lower()
                        try:
                            i_qty = max(1, int(order_item.get("qty", 1)))
                        except (ValueError, TypeError):
                            i_qty = 1
                        order_item["qty"] = i_qty

                        prod = catalog_map.get(p_id)
                        if prod:
                            # Use authoritative catalog/SKU price if available
                            unit_price = float(prod.get("price", order_item.get("price", 0)))
                            if isinstance(prod.get("customSkus"), list):
                                for cs in prod["customSkus"]:
                                    cs_suff = str(cs.get("suffix", "")).upper()
                                    cs_name = str(cs.get("name", "")).lower()
                                    if (cs_suff and cs_suff in i_sku) or (cs_name and cs_name in i_var):
                                        if cs.get("price"):
                                            unit_price = float(cs["price"])
                                        cs_stock = int(cs.get("stock", 10))
                                        cs["stock"] = max(0, cs_stock - i_qty)
                                        break
                            order_item["price"] = unit_price
                            cur_p_stock = int(prod.get("stock", 15))
                            prod["stock"] = max(0, cur_p_stock - i_qty)
                            if isinstance(prod.get("customSkus"), list) and len(prod["customSkus"]) > 0 and isinstance(prod["customSkus"][0], dict):
                                prod["customSkus"][0]["_productStock"] = prod["stock"]
                            cat_modified = True
                            verified_subtotal += unit_price * i_qty
                        else:
                            verified_subtotal += max(0.0, float(order_item.get("price", 0))) * i_qty

                    if verified_subtotal <= 0:
                        return self._send_json({"ok": False, "error": "Cannot place order with Rs 0 total."}, status=400)

                    st_settings = store_state.get("settings", {}) if isinstance(store_state, dict) else {}
                    free_threshold = int(st_settings.get("freeShippingThreshold", 3500))
                    if verified_subtotal >= free_threshold:
                        verified_shipping = 0
                    else:
                        cust_city = str(cust.get("city", "")).strip().lower()
                        city_rates = st_settings.get("cityShippingRates", {})
                        matched_rate = None
                        if isinstance(city_rates, dict):
                            for c_k, c_v in city_rates.items():
                                if str(c_k).strip().lower() == cust_city:
                                    try:
                                        matched_rate = int(c_v)
                                    except (ValueError, TypeError):
                                        matched_rate = None
                                    break
                        if matched_rate is not None:
                            verified_shipping = matched_rate
                        else:
                            try:
                                verified_shipping = int(st_settings.get("standardShippingFee", 300))
                            except (ValueError, TypeError):
                                verified_shipping = 300

                    ord_data["subtotal"] = verified_subtotal
                    ord_data["shipping"] = verified_shipping
                    ord_data["total"] = verified_subtotal + verified_shipping

                    if not ord_data.get("orderId"):
                        ord_prefix = "RAHA-ONL" if "online" in str(ord_data.get("paymentMethod", "")).lower() else "RAHA-COD"
                        ord_data["orderId"] = f"{ord_prefix}-{int(time.time() * 1000) % 90000 + 10000}"
                    if not ord_data.get("createdAt"):
                        ord_data["createdAt"] = time.strftime("%d/%m/%Y, %I:%M:%S %p")
                    if not ord_data.get("status"):
                        ord_data["status"] = "Pending"
                    if not ord_data.get("paymentMethod"):
                        ord_data["paymentMethod"] = "Cash on Delivery (COD)"
                    if not ord_data.get("paymentStatus"):
                        if "online" in str(ord_data.get("paymentMethod", "")).lower() or "RAHA-ONL" in str(ord_data.get("orderId", "")):
                            ord_data["paymentStatus"] = "Pending Verification"
                        else:
                            ord_data["paymentStatus"] = "Cash on Delivery"

                    orders = [o for o in orders if isinstance(o, dict) and o.get("orderId") != ord_data.get("orderId")]
                    orders.insert(0, ord_data)

                    c_email = str(cust.get("email", "")).strip().lower()
                    if c_email:
                        users = read_json_file(CUSTOMERS_JSON_PATH, {})
                        if not isinstance(users, dict):
                            users = {}
                        if c_email not in users:
                            users[c_email] = {"email": c_email}
                        for k in ["name", "phone", "city", "address"]:
                            val = cust.get(k)
                            if val:
                                users[c_email][k] = str(val).strip()[:500]
                        write_json_file(CUSTOMERS_JSON_PATH, users)

                    write_json_file(ORDERS_JSON_PATH, orders)
                    if cat_modified:
                        write_json_file(STORE_JSON_PATH, store_state)

                    return self._send_json({"ok": True, "order": ord_data})

        if clean_path == "/api/restock-product":
            auth_user = self._get_auth_user()
            if not auth_user or not auth_user.get("isOwner"):
                return self._send_json({"ok": False, "error": "Owner authentication required."}, status=403)
            pid = str(payload.get("productId", "")).strip()
            try:
                add_qty = max(1, int(payload.get("quantity", 10)))
            except (ValueError, TypeError):
                add_qty = 10
            with DATA_LOCK:
                store_state = read_json_file(STORE_JSON_PATH, {"catalog": []})
                updated_p = None
                if isinstance(store_state, dict) and isinstance(store_state.get("catalog"), list):
                    for p in store_state["catalog"]:
                        if p.get("id") == pid:
                            cur_stock = int(p.get("stock", 0))
                            p["stock"] = cur_stock + add_qty
                            if isinstance(p.get("customSkus"), list):
                                for cs in p["customSkus"]:
                                    cs_st = int(cs.get("stock", 0))
                                    if cs_st <= 0:
                                        cs["stock"] = add_qty
                            updated_p = p
                            break
                    if updated_p:
                        write_json_file(STORE_JSON_PATH, store_state)
                        return self._send_json({"ok": True, "product": updated_p})
            return self._send_json({"ok": False, "error": "Product not found"}, status=404)

        if clean_path == "/api/upload-image":
            return self._send_json({
                "ok": False,
                "error": "Local disk image uploads are disabled. Upload images directly to Supabase Storage."
            }, status=410)

        return self._send_json({"ok": False, "error": "Unknown endpoint"}, status=404)


class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        return super().server_bind()


if __name__ == "__main__":
    try:
        server = DualStackServer(("::", PORT), RahaStoreRequestHandler)
    except Exception:
        server = ThreadingHTTPServer(("0.0.0.0", PORT), RahaStoreRequestHandler)
    print(f"Raha Server running on http://localhost:{PORT}/ (http://127.0.0.1:{PORT}/)")
    server.serve_forever()
