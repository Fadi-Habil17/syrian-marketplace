"""Real Android acceptance against the isolated test API. Never prints field values or sessions."""
import android as ui
import json, re, sys, time
from pathlib import Path
out = Path('docs/ui-upgrade/after')
out.mkdir(parents=True, exist_ok=True)
Path('tmp/ui-run').mkdir(parents=True, exist_ok=True)
results = []

def labels():
    return [n.get('content-desc') or n.get('text') for n in ui.tree().iter('node') if ui.visible(n)]

def wait(label, timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        if label in labels():
            return
        time.sleep(0.4)
    raise AssertionError('Expected visible UI: ' + label)

def scroll(up=True):
    nodes=[n for n in ui.tree().iter('node') if 'ScrollView' in n.get('class','') and ui.visible(n)]
    if not nodes: raise RuntimeError('No visible scrollable app content')
    x1,y1,x2,y2=map(int,re.findall(r'\d+',nodes[-1].get('bounds')))
    x=(x1+x2)//2; low=y1+int((y2-y1)*.8); high=y1+int((y2-y1)*.2)
    ui.call('shell','input','swipe',str(x),str(low if up else high),str(x),str(high if up else low),'250')
    time.sleep(.4)

def top():
    for _ in range(2): scroll(False)

def tap(label):
    for _ in range(6):
        try: ui.tap(label); return
        except RuntimeError: scroll()
    raise AssertionError('Cannot reach '+label)

def shot(name):
    out.joinpath(name + '.png').write_bytes(ui.call('exec-out', 'screencap', '-p'))

def input(label, value):
    tap(label)
    ui.call('shell', 'input', 'keyevent', '123')
    ui.call('shell', 'input', 'keyevent', *['67'] * 90)
    ui.call('shell', 'input', 'text', value.replace(' ', '%s'))
    time.sleep(0.4)

def back():
    ui.call('shell', 'input', 'keyevent', '4')
    time.sleep(0.4)

def theme(current, value, ar=True):
    top()
    tap(('المظهر: ' if ar else 'Appearance: ') + current)
    tap(value)
    tap('تمام' if ar else 'Done')
    top()

def check(name, fn):
    try:
        fn()
        results.append({'name': name, 'status': 'PASS'})
        print('PASS ' + name, flush=True)
    except Exception as e:
        results.append({'name': name, 'status': 'FAIL', 'error': str(e)})
        print('FAIL ' + name + ': ' + str(e), flush=True)
        raise
try:
    if sys.argv[1] == 'layouts':

        def run():
            wait('أهلاً برجعتك')
            shot('android-login-ar-dark')
            theme('داكن', '☼, فاتح')
            shot('android-login-ar-light')
            tap('إنشاء حساب')
            top()
            shot('android-register-ar-light')
            theme('فاتح', '☾, داكن')
            shot('android-register-ar-dark')
            tap('Switch to English')
            top()
            shot('android-register-en-dark')
            theme('Dark', '☼, Light', False)
            shot('android-register-en-light')
            tap('Sign in')
            top()
            shot('android-login-en-light')
            theme('Light', '☾, Dark', False)
            shot('android-login-en-dark')
        check('Android Arabic/English login/register in Light/Dark', run)
    elif sys.argv[1] == 'auth':

        def invalid():
            top()
            if 'Switch to English' in labels():
                tap('Switch to English')
            top()
            tap('Sign in')
            wait('Enter a valid email address.')
            back()
            input('Email', 'customer@demo.marketplace.test')
            input('Password', 'IncorrectPassword123!')
            back()
            tap('Sign in')
            wait('The email or password is incorrect.')
            assert ui.find('Email', True).get('text') == 'customer@demo.marketplace.test'
            tap('Show password')
            assert ui.find('Password', True).get('text') == 'IncorrectPassword123!'
            shot('android-login-en-error')
            tap('Hide password')
        check('Android validation, real rejected login, retained values and password visibility', invalid)

        def login():
            input('Password', 'Marketplace123!')
            back()
            tap('Sign in')
            wait('الرئيسية')
            top()
            shot('android-signed-in-ar-dark')
            tap('حسابي')
            wait('خروج')
            shot('android-account-ar-dark')
            tap('خروج')
            wait('من حارتك، لكلّ سوريا.')
            tap('حسابي')
            wait('تسجيل الدخول')
        check('Android real login and signed-in account', login)
    elif sys.argv[1] in ['final','arabic','a11y']:

        def finish_session():
            top()
            tap('حسابي')
            wait('خروج')
            shot('android-account-ar-dark')
            tap('خروج')
            wait('من حارتك، لكلّ سوريا.')
            tap('حسابي')
            wait('تسجيل الدخول')
            tap('تسجيل الدخول')
            wait('أهلاً برجعتك')
        if sys.argv[1]=='final':check('Android authenticated account and real logout to guest account', finish_session)

        def arabic_login():
            if 'mInputShown=true' in ui.call('shell','dumpsys','input_method').decode('utf8'): back()
            top()
            if 'المظهر: داكن' in labels():theme('داكن','☼, فاتح')
            elif 'المظهر: حسب الجهاز' in labels():theme('حسب الجهاز','☼, فاتح')
            input('البريد الإلكتروني', 'customer@demo.marketplace.test')
            back()
            input('كلمة المرور', 'IncorrectPassword123!')
            back()
            tap('تسجيل الدخول')
            wait('البريد أو كلمة المرور غير صحيحين.')
            assert ui.find('البريد الإلكتروني', True).get('text') == 'customer@demo.marketplace.test'
            shot('android-login-ar-error')
            input('كلمة المرور', 'Marketplace123!')
            back()
            tap('تسجيل الدخول')
            wait('من حارتك، لكلّ سوريا.')
            tap('حسابي')
            wait('خروج')
            shot('android-account-ar-light')
            tap('خروج')
            wait('من حارتك، لكلّ سوريا.')
            tap('حسابي')
            wait('تسجيل الدخول')
            tap('تسجيل الدخول')
            wait('أهلاً برجعتك')
        if sys.argv[1]!='a11y':check('Android Arabic Light actual login success/failure and retained email', arabic_login)

        def accessibility():
            wait('المظهر: فاتح',45)
            if 'mInputShown=true' in ui.call('shell','dumpsys','input_method').decode('utf8'):back()
            top()
            tap('إنشاء حساب')
            if 'mInputShown=true' in ui.call('shell','dumpsys','input_method').decode('utf8'):back()
            back()
            wait('أهلاً برجعتك')
            tap('نسيت كلمة المرور؟')
            wait('استعادة الحساب')
            if 'mInputShown=true' in ui.call('shell','dumpsys','input_method').decode('utf8'):back()
            back()
            wait('أهلاً برجعتك')
            tap('المظهر: فاتح')
            wait('على ذوقك')
            back()
            wait('أهلاً برجعتك')
            ui.call('shell', 'settings', 'put', 'system', 'font_scale', '2')
            wait('المظهر: فاتح',45)
            # Expo Go recreates its activity and may reopen home on a font change.
            ui.call('shell','am','start','-W','-a','android.intent.action.VIEW','-d','exp://10.0.2.2:8082/--/auth','host.exp.exponent')
            wait('أهلاً برجعتك',45)
            top()
            shot('android-login-ar-light-font-200')
            tap('إنشاء حساب')
            top()
            shot('android-register-ar-light-font-200')
            tap('الاسم')
            time.sleep(1)
            assert 'mInputShown=true' in ui.call('shell', 'dumpsys', 'input_method').decode('utf8')
            assert 'حسابي' not in labels()
            shot('android-keyboard-font-200')
            back()
            back()
            top()
            wait('أهلاً برجعتك')
        try:
            check('Android hardware back, recovery action, 200% text and keyboard navigation', accessibility)
        finally:
            ui.call('shell', 'settings', 'put', 'system', 'font_scale', '1')
    elif sys.argv[1] == 'config-theme':

        def config_theme():
            wait('أهلاً برجعتك',45)
            if 'المظهر: داكن' in labels():theme('داكن','☼, فاتح')
            elif 'المظهر: حسب الجهاز' in labels():theme('حسب الجهاز','☼, فاتح')
            wait('المظهر: فاتح',45)
            ui.call('shell','settings','put','system','font_scale','1.5')
            wait('المظهر: فاتح',45)
            ui.call('shell','am','start','-W','-a','android.intent.action.VIEW','-d','exp://10.0.2.2:8082/--/auth','host.exp.exponent')
            wait('أهلاً برجعتك',45)
            top();tap('المظهر: فاتح');tap('☾, داكن');tap('تمام')
            time.sleep(3)
            Path('tmp/ui-run/config-before-restore.png').write_bytes(ui.call('exec-out','screencap','-p'))
            Path('tmp/ui-run/config-before-restore.json').write_text(json.dumps(labels(),ensure_ascii=False),encoding='utf8')
            wait('المظهر: داكن',45)
            ui.call('shell','am','start','-W','-a','android.intent.action.VIEW','-d','exp://10.0.2.2:8082/--/auth','host.exp.exponent')
            wait('أهلاً برجعتك',45);top();tap('إظهار كلمة المرور');wait('إخفاء كلمة المرور');shot('android-theme-after-font-change')
        try:check('Android appearance after font configuration change, native modal dismissed before apply',config_theme)
        finally:ui.call('shell','settings','put','system','font_scale','1')
    elif sys.argv[1] == 'matrix':

        def run_matrix():
            ui.call('shell','am','start','-W','-a','android.intent.action.VIEW','-d','exp://10.0.2.2:8082/--/auth','host.exp.exponent')
            wait('أهلاً برجعتك',45)
            for language,mode in [('ar','dark'),('en','light')]:
                ar=language=='ar'
                top()
                if not ar:tap('Switch to English')
                prefix='المظهر: ' if ar else 'Appearance: '
                current=next(x[len(prefix):] for x in labels() if x.startswith(prefix))
                desired=('فاتح' if mode=='light' else 'داكن') if ar else mode.title()
                if current!=desired:theme(current,('☼, ' if mode=='light' else '☾, ')+desired,ar)
                input('البريد الإلكتروني' if ar else 'Email','customer@demo.marketplace.test');back()
                input('كلمة المرور' if ar else 'Password','IncorrectPassword123!');back()
                tap('تسجيل الدخول' if ar else 'Sign in')
                wait('البريد أو كلمة المرور غير صحيحين.' if ar else 'The email or password is incorrect.')
                top();assert ui.find('البريد الإلكتروني' if ar else 'Email',True).get('text')=='customer@demo.marketplace.test'
                input('كلمة المرور' if ar else 'Password','Marketplace123!');back()
                tap('تسجيل الدخول' if ar else 'Sign in');wait('من حارتك، لكلّ سوريا.')
                tap('حسابي');wait('خروج');top();shot('android-account-'+language+'-'+mode+'-matrix')
                assert ('المظهر: '+('داكن' if mode=='dark' else 'فاتح')) in labels()
                tap('خروج');wait('من حارتك، لكلّ سوريا.');tap('حسابي');wait('تسجيل الدخول');tap('تسجيل الدخول');wait('أهلاً برجعتك')
                print('PASS native login '+language+' '+mode+' with actual rejection, success and logout',flush=True)
        check('Remaining native login matrix: Arabic Dark and English Light',run_matrix)
    elif sys.argv[1] == 'registration':

        def run():
            top()
            if 'مكانك بين أهل الحارة' in labels():
                tap('تسجيل الدخول')
                top()
            for language in ['ar', 'en']:
                ar = language == 'ar'
                for mode in ['light', 'dark']:
                    top()
                    ls = labels()
                    desired = ('فاتح' if mode == 'light' else 'داكن') if ar else mode.title()
                    prefix = 'المظهر: ' if ar else 'Appearance: '
                    current = next((x[len(prefix):] for x in ls if x.startswith(prefix)))
                    if current != desired:
                        theme(current, ('☼, ' if mode == 'light' else '☾, ') + desired, ar)
                    tap('إنشاء حساب' if ar else 'Create account')
                    top()
                    email = 'native-' + language + '-' + mode + '-' + str(int(time.time())) + '@demo.marketplace.test'
                    input('الاسم' if ar else 'Display name', 'Fictional native review')
                    back()
                    input('البريد الإلكتروني' if ar else 'Email', email)
                    back()
                    input('كلمة المرور' if ar else 'Password', 'Marketplace123!')
                    back()
                    tap('إنشاء حساب' if ar else 'Create account')
                    time.sleep(2)
                    scroll()
                    time.sleep(0.4)
                    wait('حسابك جاهز! سجّل الدخول للمتابعة.' if ar else 'Your account is ready! Sign in to continue.')
                    shot('android-register-success-' + language + '-' + mode)
                    top()
                    input('كلمة المرور' if ar else 'Password', 'Marketplace123!')
                    back()
                    tap('إنشاء حساب' if ar else 'Create account')
                    time.sleep(2)
                    scroll()
                    time.sleep(0.4)
                    assert not any(('Welcome to the neighbourhood!' in x or 'أهلاً في الحارة!' in x for x in labels()))
                    top()
                    assert ui.find('البريد الإلكتروني' if ar else 'Email', True).get('text') == email
                    assert ui.find('الاسم' if ar else 'Display name', True).get('text') == 'Fictional native review'
                    shot('android-register-duplicate-' + language + '-' + mode)
                    tap('تسجيل الدخول' if ar else 'Sign in')
                    top()
                if ar:
                    tap('Switch to English')
        check('Android real registration and duplicate value preservation in both languages/themes', run)
    elif sys.argv[1] == 'appearance':

        def persistent():
            wait('أهلاً برجعتك',45)
            if 'المظهر: فاتح' in labels():theme('فاتح','☾, داكن')
            elif 'المظهر: حسب الجهاز' in labels():theme('حسب الجهاز','☾, داكن')
            wait('المظهر: داكن',45)
            ui.call('shell', 'am', 'force-stop', 'host.exp.exponent')
            time.sleep(1)
            ui.call('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'exp://10.0.2.2:8082/--/auth', 'host.exp.exponent')
            wait('المظهر: داكن', 40)
            shot('android-theme-persisted')
        check('Android Dark preference survives process restart', persistent)

        def system():
            theme('داكن', '◐, حسب الجهاز')
            ui.call('shell', 'cmd', 'uimode', 'night', 'yes')
            wait('المظهر: حسب الجهاز',45)
            shot('android-system-dark')
            ui.call('shell', 'cmd', 'uimode', 'night', 'no')
            wait('المظهر: حسب الجهاز',45)
            shot('android-system-light')
        check('Android System preference follows OS light/dark', system)
finally:
    if sys.argv[1]=='appearance':ui.call('shell','cmd','uimode','night','no')
    Path('tmp/ui-run/android-' + sys.argv[1] + '-results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf8')
