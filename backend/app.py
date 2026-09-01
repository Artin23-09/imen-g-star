from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import jwt
import datetime
import json

app = Flask(__name__, static_folder='../', static_url_path='')
CORS(app)

# ==================== تنظیمات ====================
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///imen_g_star.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "imen-g-star-secret-key-change-this-in-production-2026"
app.config["JWT_EXPIRATION_HOURS"] = 24

db = SQLAlchemy(app)

# ==================== مدل‌ها ====================

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.String(50), nullable=True)
    badge = db.Column(db.String(50), nullable=True)
    emoji = db.Column(db.String(10), nullable=True, default='📷')
    image = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "desc": self.description,
            "description": self.description,
            "price": self.price,
            "badge": self.badge,
            "emoji": self.emoji,
            "image": self.image,
            "is_active": self.is_active
        }


class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    icon = db.Column(db.String(10), default='🔧')
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "icon": self.icon,
            "title": self.title,
            "desc": self.description,
            "description": self.description
        }


class Testimonial(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=True)
    text = db.Column(db.Text, nullable=False)
    stars = db.Column(db.Integer, default=5)
    initial = db.Column(db.String(5), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "text": self.text,
            "stars": self.stars,
            "initial": self.initial or (self.name[0] if self.name else '؟')
        }


class TeamMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    initial = db.Column(db.String(5), nullable=True)
    order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "initial": self.initial or (self.name[0] if self.name else '؟')
        }


class ContactInfo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(150), default='ایمن جی استار')
    phone1 = db.Column(db.String(30), nullable=True)
    phone2 = db.Column(db.String(30), nullable=True)
    email1 = db.Column(db.String(100), nullable=True)
    email2 = db.Column(db.String(100), nullable=True)
    address = db.Column(db.Text, nullable=True)
    work_hours = db.Column(db.String(100), nullable=True)
    instagram = db.Column(db.String(150), nullable=True)
    telegram = db.Column(db.String(150), nullable=True)
    whatsapp = db.Column(db.String(50), nullable=True)
    linkedin = db.Column(db.String(150), nullable=True)

    def to_dict(self):
        return {
            "companyName": self.company_name,
            "phone1": self.phone1,
            "phone2": self.phone2,
            "email1": self.email1,
            "email2": self.email2,
            "address": self.address,
            "workHours": self.work_hours,
            "instagram": self.instagram,
            "telegram": self.telegram,
            "whatsapp": self.whatsapp,
            "linkedin": self.linkedin
        }


class SiteSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)

    def get_value(self):
        if self.value:
            try:
                return json.loads(self.value)
            except:
                return self.value
        return None

    def set_value(self, data):
        self.value = json.dumps(data, ensure_ascii=False)


# ==================== احراز هویت ====================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({"success": False, "message": "توکن احراز هویت وجود ندارد"}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_admin = Admin.query.filter_by(id=data['admin_id']).first()
            if not current_admin:
                return jsonify({"success": False, "message": "کاربر نامعتبر"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "توکن منقضی شده"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "توکن نامعتبر"}), 401

        return f(current_admin, *args, **kwargs)
    return decorated


# ==================== مقداردهی اولیه ====================

def seed_data():
    if not Admin.query.first():
        admin = Admin(username='admin')
        admin.set_password('admin123')
        db.session.add(admin)

    if not Product.query.first():
        products = [
            Product(name='دوربین تحت شبکه ۴K هوشمند', category='camera', description='رزولوشن ۸ مگاپیکسل، دید در شب رنگی، قابلیت PoE', price='۱۲,۵۰۰,۰۰۰', badge='پرفروش', emoji='📷'),
            Product(name='دوربین PTZ هوشمند', category='camera', description='چرخش ۳۶۰ درجه، زوم اپتیکال ۲۵ برابر', price='۱۸,۰۰۰,۰۰۰', badge='جدید', emoji='📹'),
            Product(name='دوربین بولت ضد آب', category='camera', description='استاندارد IP67، دید در شب ۸۰ متر', price='۸,۵۰۰,۰۰۰', badge='ویژه', emoji='🔦'),
            Product(name='دستگاه NVR ۱۶ کاناله', category='nvr', description='پشتیبانی از ۱۶ دوربین، ضبط ۲۴ ساعته', price='۸,۹۰۰,۰۰۰', badge='پیشنهادی', emoji='🖥️'),
            Product(name='دستگاه NVR ۳۲ کاناله', category='nvr', description='مناسب پروژه‌های بزرگ', price='۱۵,۰۰۰,۰۰۰', badge='حرفه‌ای', emoji='💻'),
            Product(name='دزدگیر هوشمند اماکن', category='alarm', description='ارسال پیامک و تماس، سنسور حرکتی', price='۶,۵۰۰,۰۰۰', badge='امنیت', emoji='🚨'),
            Product(name='سیستم اعلام حریق', category='alarm', description='تشخیص دود و حرارت، آژیر و چراغ گردان', price='۴,۲۰۰,۰۰۰', badge='حریق', emoji='🔥'),
            Product(name='پکیج خانه هوشمند', category='smart', description='کنترل روشنایی، درب، دوربین و سنسورها', price='۳۵,۰۰۰,۰۰۰', badge='هوشمند', emoji='🏠'),
            Product(name='سیستم اکسس کنترل', category='smart', description='تشخیص چهره و اثر انگشت', price='۹,۸۰۰,۰۰۰', badge='کنترل تردد', emoji='🚪'),
        ]
        for p in products:
            db.session.add(p)

    if not Service.query.first():
        services = [
            Service(icon='🎥', title='نصب دوربین مداربسته', description='نصب حرفه‌ای دوربین‌های IP، آنالوگ و تحت شبکه با بهترین کیفیت و زاویه دید', order=1),
            Service(icon='🏠', title='سیستم‌های هوشمند', description='طراحی و اجرای سیستم‌های خانه هوشمند با قابلیت کنترل از راه دور', order=2),
            Service(icon='🛡️', title='دزدگیر و اعلام حریق', description='سیستم‌های اعلام سرقت و حریق با اتصال به مرکز فوریت‌ها و اپلیکیشن موبایل', order=3),
            Service(icon='📡', title='سیستم‌های اکسس کنترل', description='کنترل تردد با اثر انگشت، کارت و تشخیص چهره برای ورودی‌های مختلف', order=4),
            Service(icon='🔧', title='تعمیر و سرویس', description='تعمیر، به‌روزرسانی و سرویس دوره‌ای تمامی تجهیزات حفاظتی', order=5),
            Service(icon='💡', title='مشاوره و طراحی', description='بازدید رایگان، مشاوره تخصصی و طراحی نقشه اجرایی پروژه شما', order=6),
        ]
        for s in services:
            db.session.add(s)

    if not Testimonial.query.first():
        testimonials = [
            Testimonial(name='محمد احمدی', role='صاحب فروشگاه', text='نصب دوربین‌ها بسیار حرفه‌ای انجام شد. کیفیت تصاویر عالیه و از راه دور می‌تونم مغازه‌ام رو چک کنم.', stars=5, initial='م'),
            Testimonial(name='حسین رضایی', role='مدیر شرکت', text='سیستم دزدگیری که نصب کردید چند بار جلوی سرقت رو گرفته. خیلی راضیم.', stars=5, initial='ح'),
            Testimonial(name='سارا محمدی', role='خانه‌دار', text='خانه هوشمندی که طراحی کردید زندگی رو راحت‌تر کرده. همه چیز با موبایل کنترل میشه.', stars=5, initial='س'),
        ]
        for t in testimonials:
            db.session.add(t)

    if not TeamMember.query.first():
        team = [
            TeamMember(name='علی محمدی', role='مدیرعامل', initial='ع', order=1),
            TeamMember(name='رضا کریمی', role='مدیر فنی', initial='ر', order=2),
            TeamMember(name='مریم عباسی', role='مدیر فروش', initial='م', order=3),
            TeamMember(name='امیر حسینی', role='سرپرست نصب', initial='ا', order=4),
        ]
        for m in team:
            db.session.add(m)

    if not ContactInfo.query.first():
        contact = ContactInfo(
            company_name='ایمن جی استار',
            phone1='۰۲۱-۱۲۳۴۵۶۷۸',
            phone2='۰۹۱۲۱۲۳۴۵۶۷',
            email1='info@cheshmban.ir',
            email2='sales@cheshmban.ir',
            address='تهران، خیابان ولیعصر، پلاک ۱۲۳',
            work_hours='شنبه تا پنجشنبه ۸ الی ۲۰'
        )
        db.session.add(contact)

    defaults = {
        'hero': {
            'badge': 'محافظت هوشمند ۲۴/۷',
            'title': 'امنیت خانه و کسب‌وکارتان را',
            'titleHighlight': 'به ما بسپارید',
            'subtitle': 'با پیشرفته‌ترین دوربین‌های مداربسته و سیستم‌های حفاظتی، محیط امن و مطمئنی برای شما می‌سازیم. نصب، پشتیبانی و خدمات ۲۴ ساعته.',
            'btn1Text': 'مشاهده محصولات',
            'btn2Text': 'مشاوره رایگان'
        },
        'advantages': [
            {'number': '۱۲', 'title': 'سال تجربه', 'desc': 'بیش از یک دهه فعالیت حرفه‌ای'},
            {'number': '۱۵۰۰', 'title': 'پروژه موفق', 'desc': 'اجرای موفق پروژه‌های حفاظتی'},
            {'number': '۲۴', 'title': 'ساعت پشتیبانی', 'desc': 'خدمات پشتیبانی شبانه‌روزی'},
            {'number': '۹۸', 'title': 'رضایت مشتری', 'desc': 'درصد رضایت بالای مشتریان'}
        ],
        'about': {
            'title': 'شرکت ایمن جی استار',
            'text1': 'شرکت ایمن جی استار با بیش از ۱۲ سال تجربه در زمینه تأمین، نصب و پشتیبانی سیستم‌های حفاظتی و نظارتی، یکی از معتبرترین شرکت‌های این حوزه در کشور است.',
            'text2': 'ما با بهره‌گیری از تیم متخصص و با تجربه، پیشرفته‌ترین تجهیزات برندهای معتبر جهانی را با بهترین کیفیت و قیمت مناسب به شما ارائه می‌دهیم.',
            'features': ['بیش از ۱۲ سال تجربه', 'بیش از ۱۵۰۰ پروژه موفق', 'بیش از ۵۰ متخصص مجرب', 'گارانتی و خدمات پس از فروش']
        },
        'cta': {
            'title': 'آماده ایمن کردن فضای خود هستید؟',
            'desc': 'همین الان با ما تماس بگیرید و از مشاوره رایگان بهره‌مند شوید',
            'btn1Text': 'تماس با ما',
            'btn2Text': 'مشاهده محصولات'
        }
    }

    for key, value in defaults.items():
        if not SiteSetting.query.filter_by(key=key).first():
            setting = SiteSetting(key=key)
            setting.set_value(value)
            db.session.add(setting)

    db.session.commit()
    print("✅ داده‌های اولیه با موفقیت ایجاد شد")


with app.app_context():
    db.create_all()
    seed_data()


# ==================== روت‌های عمومی ====================

@app.route('/api/health')
def health():
    return jsonify({"success": True, "message": "Backend is running"})


@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.filter_by(is_active=True).order_by(Product.id).all()
    return jsonify([p.to_dict() for p in products])


@app.route('/api/services', methods=['GET'])
def get_services():
    services = Service.query.order_by(Service.order, Service.id).all()
    return jsonify([s.to_dict() for s in services])


@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    items = Testimonial.query.order_by(Testimonial.id).all()
    return jsonify([t.to_dict() for t in items])


@app.route('/api/team', methods=['GET'])
def get_team():
    members = TeamMember.query.order_by(TeamMember.order, TeamMember.id).all()
    return jsonify([m.to_dict() for m in members])


@app.route('/api/contact', methods=['GET'])
def get_contact():
    contact = ContactInfo.query.first()
    if contact:
        return jsonify(contact.to_dict())
    return jsonify({})


@app.route('/api/settings/<key>', methods=['GET'])
def get_setting(key):
    setting = SiteSetting.query.filter_by(key=key).first()
    if setting:
        return jsonify(setting.get_value())
    return jsonify(None)


@app.route('/api/settings', methods=['GET'])
def get_all_settings():
    settings = SiteSetting.query.all()
    return jsonify({s.key: s.get_value() for s in settings})


# ==================== احراز هویت ادمین ====================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({"success": False, "message": "نام کاربری یا رمز عبور اشتباه است"}), 401

    token = jwt.encode({
        'admin_id': admin.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        "success": True,
        "token": token,
        "message": "ورود موفق"
    })


@app.route('/api/admin/change-password', methods=['POST'])
@token_required
def change_password(current_admin):
    data = request.get_json() or {}
    current = data.get('current_password', '')
    new_pass = data.get('new_password', '')

    if not current_admin.check_password(current):
        return jsonify({"success": False, "message": "رمز فعلی اشتباه است"}), 400

    if len(new_pass) < 4:
        return jsonify({"success": False, "message": "رمز جدید حداقل ۴ کاراکتر باشد"}), 400

    current_admin.set_password(new_pass)
    db.session.commit()
    return jsonify({"success": True, "message": "رمز عبور با موفقیت تغییر کرد"})


# ==================== مدیریت محصولات ====================

@app.route('/api/admin/products', methods=['GET'])
@token_required
def admin_get_products(current_admin):
    products = Product.query.order_by(Product.id.desc()).all()
    return jsonify([p.to_dict() for p in products])


@app.route('/api/admin/products', methods=['POST'])
@token_required
def admin_create_product(current_admin):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "message": "نام محصول الزامی است"}), 400

    product = Product(
        name=name,
        category=data.get('category', 'camera'),
        description=data.get('desc') or data.get('description', ''),
        price=data.get('price', ''),
        badge=data.get('badge', 'جدید'),
        emoji=data.get('emoji', '📷'),
        image=data.get('image'),
        is_active=data.get('is_active', True)
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"success": True, "message": "محصول اضافه شد", "product": product.to_dict()}), 201


@app.route('/api/admin/products/<int:pid>', methods=['PUT'])
@token_required
def admin_update_product(current_admin, pid):
    product = Product.query.get(pid)
    if not product:
        return jsonify({"success": False, "message": "محصول پیدا نشد"}), 404

    data = request.get_json() or {}
    if 'name' in data:
        product.name = data['name']
    if 'category' in data:
        product.category = data['category']
    if 'desc' in data or 'description' in data:
        product.description = data.get('desc') or data.get('description')
    if 'price' in data:
        product.price = data['price']
    if 'badge' in data:
        product.badge = data['badge']
    if 'emoji' in data:
        product.emoji = data['emoji']
    if 'image' in data:
        product.image = data['image']
    if 'is_active' in data:
        product.is_active = data['is_active']

    db.session.commit()
    return jsonify({"success": True, "message": "محصول ویرایش شد", "product": product.to_dict()})


@app.route('/api/admin/products/<int:pid>', methods=['DELETE'])
@token_required
def admin_delete_product(current_admin, pid):
    product = Product.query.get(pid)
    if not product:
        return jsonify({"success": False, "message": "محصول پیدا نشد"}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({"success": True, "message": "محصول حذف شد"})


# ==================== مدیریت خدمات ====================

@app.route('/api/admin/services', methods=['GET'])
@token_required
def admin_get_services(current_admin):
    services = Service.query.order_by(Service.order, Service.id).all()
    return jsonify([s.to_dict() for s in services])


@app.route('/api/admin/services', methods=['POST'])
@token_required
def admin_create_service(current_admin):
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({"success": False, "message": "عنوان خدمت الزامی است"}), 400

    service = Service(
        icon=data.get('icon', '🔧'),
        title=title,
        description=data.get('desc') or data.get('description', ''),
        order=data.get('order', 0)
    )
    db.session.add(service)
    db.session.commit()
    return jsonify({"success": True, "message": "خدمت اضافه شد", "service": service.to_dict()}), 201


@app.route('/api/admin/services/<int:sid>', methods=['PUT'])
@token_required
def admin_update_service(current_admin, sid):
    service = Service.query.get(sid)
    if not service:
        return jsonify({"success": False, "message": "خدمت پیدا نشد"}), 404

    data = request.get_json() or {}
    if 'icon' in data:
        service.icon = data['icon']
    if 'title' in data:
        service.title = data['title']
    if 'desc' in data or 'description' in data:
        service.description = data.get('desc') or data.get('description')
    if 'order' in data:
        service.order = data['order']

    db.session.commit()
    return jsonify({"success": True, "message": "خدمت ویرایش شد", "service": service.to_dict()})


@app.route('/api/admin/services/<int:sid>', methods=['DELETE'])
@token_required
def admin_delete_service(current_admin, sid):
    service = Service.query.get(sid)
    if not service:
        return jsonify({"success": False, "message": "خدمت پیدا نشد"}), 404
    db.session.delete(service)
    db.session.commit()
    return jsonify({"success": True, "message": "خدمت حذف شد"})


# ==================== مدیریت نظرات ====================

@app.route('/api/admin/testimonials', methods=['GET'])
@token_required
def admin_get_testimonials(current_admin):
    items = Testimonial.query.order_by(Testimonial.id.desc()).all()
    return jsonify([t.to_dict() for t in items])


@app.route('/api/admin/testimonials', methods=['POST'])
@token_required
def admin_create_testimonial(current_admin):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    text = data.get('text', '').strip()
    if not name or not text:
        return jsonify({"success": False, "message": "نام و متن نظر الزامی است"}), 400

    item = Testimonial(
        name=name,
        role=data.get('role', ''),
        text=text,
        stars=int(data.get('stars', 5)),
        initial=data.get('initial') or name[0]
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"success": True, "message": "نظر اضافه شد", "testimonial": item.to_dict()}), 201


@app.route('/api/admin/testimonials/<int:tid>', methods=['PUT'])
@token_required
def admin_update_testimonial(current_admin, tid):
    item = Testimonial.query.get(tid)
    if not item:
        return jsonify({"success": False, "message": "نظر پیدا نشد"}), 404

    data = request.get_json() or {}
    if 'name' in data:
        item.name = data['name']
        item.initial = data.get('initial') or data['name'][0]
    if 'role' in data:
        item.role = data['role']
    if 'text' in data:
        item.text = data['text']
    if 'stars' in data:
        item.stars = int(data['stars'])

    db.session.commit()
    return jsonify({"success": True, "message": "نظر ویرایش شد", "testimonial": item.to_dict()})


@app.route('/api/admin/testimonials/<int:tid>', methods=['DELETE'])
@token_required
def admin_delete_testimonial(current_admin, tid):
    item = Testimonial.query.get(tid)
    if not item:
        return jsonify({"success": False, "message": "نظر پیدا نشد"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"success": True, "message": "نظر حذف شد"})


# ==================== مدیریت تیم ====================

@app.route('/api/admin/team', methods=['GET'])
@token_required
def admin_get_team(current_admin):
    members = TeamMember.query.order_by(TeamMember.order, TeamMember.id).all()
    return jsonify([m.to_dict() for m in members])


@app.route('/api/admin/team', methods=['POST'])
@token_required
def admin_create_member(current_admin):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    role = data.get('role', '').strip()
    if not name or not role:
        return jsonify({"success": False, "message": "نام و سمت الزامی است"}), 400

    member = TeamMember(
        name=name,
        role=role,
        initial=data.get('initial') or name[0],
        order=data.get('order', 0)
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({"success": True, "message": "عضو اضافه شد", "member": member.to_dict()}), 201


@app.route('/api/admin/team/<int:mid>', methods=['PUT'])
@token_required
def admin_update_member(current_admin, mid):
    member = TeamMember.query.get(mid)
    if not member:
        return jsonify({"success": False, "message": "عضو پیدا نشد"}), 404

    data = request.get_json() or {}
    if 'name' in data:
        member.name = data['name']
        member.initial = data.get('initial') or data['name'][0]
    if 'role' in data:
        member.role = data['role']
    if 'order' in data:
        member.order = data['order']

    db.session.commit()
    return jsonify({"success": True, "message": "عضو ویرایش شد", "member": member.to_dict()})


@app.route('/api/admin/team/<int:mid>', methods=['DELETE'])
@token_required
def admin_delete_member(current_admin, mid):
    member = TeamMember.query.get(mid)
    if not member:
        return jsonify({"success": False, "message": "عضو پیدا نشد"}), 404
    db.session.delete(member)
    db.session.commit()
    return jsonify({"success": True, "message": "عضو حذف شد"})


# ==================== اطلاعات تماس ====================

@app.route('/api/admin/contact', methods=['GET'])
@token_required
def admin_get_contact(current_admin):
    contact = ContactInfo.query.first()
    if contact:
        return jsonify(contact.to_dict())
    return jsonify({})


@app.route('/api/admin/contact', methods=['PUT'])
@token_required
def admin_update_contact(current_admin):
    data = request.get_json() or {}
    contact = ContactInfo.query.first()
    if not contact:
        contact = ContactInfo()
        db.session.add(contact)

    contact.company_name = data.get('companyName', contact.company_name)
    contact.phone1 = data.get('phone1', contact.phone1)
    contact.phone2 = data.get('phone2', contact.phone2)
    contact.email1 = data.get('email1', contact.email1)
    contact.email2 = data.get('email2', contact.email2)
    contact.address = data.get('address', contact.address)
    contact.work_hours = data.get('workHours', contact.work_hours)
    contact.instagram = data.get('instagram', contact.instagram)
    contact.telegram = data.get('telegram', contact.telegram)
    contact.whatsapp = data.get('whatsapp', contact.whatsapp)
    contact.linkedin = data.get('linkedin', contact.linkedin)

    db.session.commit()
    return jsonify({"success": True, "message": "اطلاعات تماس ذخیره شد", "contact": contact.to_dict()})


# ==================== تنظیمات سایت ====================

@app.route('/api/admin/settings/<key>', methods=['GET'])
@token_required
def admin_get_setting(current_admin, key):
    setting = SiteSetting.query.filter_by(key=key).first()
    if setting:
        return jsonify(setting.get_value())
    return jsonify(None)


@app.route('/api/admin/settings/<key>', methods=['PUT'])
@token_required
def admin_update_setting(current_admin, key):
    data = request.get_json()
    if data is None:
        return jsonify({"success": False, "message": "داده ارسال نشده"}), 400

    setting = SiteSetting.query.filter_by(key=key).first()
    if not setting:
        setting = SiteSetting(key=key)
        db.session.add(setting)

    setting.set_value(data)
    db.session.commit()
    return jsonify({"success": True, "message": "تنظیمات ذخیره شد", "data": setting.get_value()})


# ==================== داشبورد آمار ====================

@app.route('/api/admin/stats', methods=['GET'])
@token_required
def admin_stats(current_admin):
    return jsonify({
        "products": Product.query.count(),
        "services": Service.query.count(),
        "testimonials": Testimonial.query.count(),
        "team": TeamMember.query.count(),
        "categories": db.session.query(Product.category).distinct().count()
    })


# ==================== سرو کردن فرانت‌اند ====================

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    print("=" * 50)
    print("🚀 ایمن جی استار - Backend")
    print("=" * 50)
    print("Admin default: admin / admin123")
    print("API: http://localhost:5000/api/health")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
