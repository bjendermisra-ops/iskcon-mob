#!/usr/bin/env python3
# Usage: python convert_to_chandra_mandir.py index.html
# Output: index_chandra_mandir.html  (original file untouched)
import sys, re

src = sys.argv[1] if len(sys.argv) > 1 else "index.html"
dst = "index_chandra_mandir.html"
h = open(src, encoding="utf-8").read()
missed = []

def rep(old, new, count=0):
    global h
    if old not in h:
        missed.append(old[:60])
        return
    h = h.replace(old, new) if count == 0 else h.replace(old, new, count)

TEMPLE_HI = "श्री श्री राधाकृष्ण चंद्र मंदिर"
TEMPLE_EN = "Sri Sri Radha Krishna Chandra Mandir"
ADDR = "श्री श्री राधाकृष्ण चंद्र मंदिर, 15 नंबर, हडपसर, पुणे, महाराष्ट्र"
OLD_ADDR = "GW2M+X5J, Pune - Solapur Rd, near Kanyadan Mangal Karyalaya, Aru Nagar, Bhosale Nagar, Hadapsar, Pune, Maharashtra 411028"
OLD_ADDR_ENC = "GW2M%2BX5J%2C+Pune+-+Solapur+Rd%2C+near+Kanyadan+Mangal+Karyalaya%2C+Aru+Nagar%2C+Bhosale+Nagar%2C+Hadapsar%2C+Pune%2C+Maharashtra+411028"
NEW_ADDR_ENC = "Sri+Sri+Radha+Krishna+Chandra+Mandir+15+Number+Hadapsar+Pune"

# ---------- Branding ----------
rep("<title>ISKCON Hadapsar</title>", "<title>" + TEMPLE_HI + "</title>")
rep("margin-left: 4px;\">Iskcon Hadapsar</span>",
    "margin-left: 4px; display:flex; flex-direction:column; line-height:1.15;\">"
    "<span class=\"brand-main\">राधाकृष्ण चंद्र मंदिर</span>"
    "<span class=\"brand-sub\">15 नंबर • हडपसर, पुणे</span></span>")
rep("© 2026 ISKCON Hadapsar. All Rights Reserved.", "© 2026 " + TEMPLE_EN + ", Hadapsar. All Rights Reserved.")
rep("app_name: \"ISKCON Hadapsar\"", "app_name: \"" + TEMPLE_EN + "\"")
rep("app_name: \"इस्कॉन हडपसर\"", "app_name: \"" + TEMPLE_HI + "\"")
rep("ISKCON Menu", "Temple Menu")
rep("About ISKCON", "About Temple")
rep("ISKCON Padyatra", "Temple Padyatra")
rep("इस्कॉन पदयात्रा", "मंदिर पदयात्रा")
rep("त्याच्या쵝 विश्वासाने", "त्याच्या विश्वासाने")  # stray character bug fix

# ---------- Address / Map ----------
rep(OLD_ADDR, ADDR)
rep(OLD_ADDR_ENC, NEW_ADDR_ENC)

# ---------- YouTube ----------
rep("youtube.com/@iskcon_hadapsar?si=sPlFhreQZ9YJ7Fl1", "youtube.com/@srisriradhakrsnachandraman9892")
rep("youtube.com/@iskcon_hadapsar", "youtube.com/@srisriradhakrsnachandraman9892")

# ---------- Old ISKCON Hadapsar FB/Insta hidden until temple's own links are added ----------
# (set SHOW_OLD_SOCIAL = True to bring them back)
SHOW_OLD_SOCIAL = False
if not SHOW_OLD_SOCIAL:
    rep('class="f-icon"><i class="fab fa-facebook-f">', 'class="f-icon d-none"><i class="fab fa-facebook-f">')
    rep('class="f-icon"><i class="fab fa-instagram">', 'class="f-icon d-none"><i class="fab fa-instagram">')

# ---------- Premium UI CSS ----------
CSS = """
        /* ===== Chandra Mandir Premium Layer ===== */
        body { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
        .brand-main { font-family: 'Noto Sans Devanagari','Poppins',sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: .2px; }
        .brand-sub { font-size: .62rem; font-weight: 600; opacity: .92; letter-spacing: .4px; }
        .navbar { backdrop-filter: blur(8px); }
        .temple-welcome { margin: 12px 12px 0; padding: 14px 16px; border-radius: 18px; position: relative; overflow: hidden;
            background: linear-gradient(135deg, #5D1049 0%, #8E1B5E 55%, #C2185B 100%); color: #fff; box-shadow: var(--epic-shadow);
            border: 1px solid rgba(255,255,255,.18); text-align: center; }
        .temple-welcome::before { content: '🪷'; position: absolute; left: -12px; top: -14px; font-size: 5rem; opacity: .12; }
        .temple-welcome::after { content: '🌸'; position: absolute; right: -10px; bottom: -16px; font-size: 5rem; opacity: .12; }
        .tw-jai { font-size: .72rem; letter-spacing: 2px; color: #FFE082; font-weight: 700; }
        .tw-name { font-family: 'Noto Sans Devanagari','Cinzel',serif; font-size: 1.2rem; font-weight: 800; line-height: 1.3; margin: 3px 0; text-shadow: 0 2px 6px rgba(0,0,0,.35); }
        .tw-loc { font-size: .74rem; font-weight: 600; opacity: .95; }
        .tw-chips { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
        .tw-chip { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); border-radius: 12px; padding: 3px 10px; font-size: .66rem; font-weight: 700; color: #fff; }
        .feature-card:active, .preview-card:active, .menu-item:active, .calendar-premium-card:active, .padyatra-card:active { transform: scale(.97) !important; transition: transform .12s ease; }
        .support-fab { bottom: calc(86px + env(safe-area-inset-bottom, 0px)); }
        .bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1030; display: flex; justify-content: space-around; align-items: center;
            padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px)); background: rgba(255,255,255,.92); backdrop-filter: blur(14px);
            border-top: 1px solid rgba(255,143,0,.25); box-shadow: 0 -6px 20px rgba(0,0,0,.08); }
        [data-theme="dark"] .bottom-nav { background: rgba(30,21,17,.94); }
        .bn-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 0; color: var(--text-color); opacity: .75; font-size: .64rem; font-weight: 700; border-radius: 12px; cursor: pointer; }
        .bn-item i { font-size: 1.2rem; color: var(--primary); }
        .bn-item:active { transform: scale(.92); background: rgba(255,143,0,.12); opacity: 1; }
        .bn-center i { color: #fff; background: linear-gradient(135deg, #FF9933, #E65100); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -22px; box-shadow: 0 6px 16px rgba(230,81,0,.45); border: 3px solid var(--bg-color); }
    </style>"""
rep("    </style>", CSS, 1)

# ---------- Welcome card (inserted above slider) ----------
WELCOME = """<div class="temple-welcome" data-aos="fade-down" data-aos-duration="600">
    <div class="tw-jai">॥ जय श्री राधे कृष्ण ॥</div>
    <div class="tw-name">श्री श्री राधाकृष्ण चंद्र मंदिर</div>
    <div class="tw-loc"><i class="fas fa-location-dot"></i> 15 नंबर, हडपसर, पुणे</div>
    <div class="tw-chips"><span class="tw-chip">कीर्तन</span><span class="tw-chip">कथा</span><span class="tw-chip">अभिषेक</span><span class="tw-chip">राजभोग सेवा</span><span class="tw-chip">महाप्रसाद</span></div>
</div>

<div id="heroCarousel" """
rep('<div id="heroCarousel" ', WELCOME, 1)

# ---------- Bottom navigation (uses existing go: routes + existing sidebar) ----------
NAV = """<div class="bottom-nav">
    <a href="go:home" class="bn-item"><i class="fas fa-home"></i><span>Home</span></a>
    <a href="go:darshan" class="bn-item"><i class="fas fa-video"></i><span>Darshan</span></a>
    <a href="go:chanting" class="bn-item bn-center"><i class="fas fa-om"></i><span>Japa</span></a>
    <a href="go:dono" class="bn-item"><i class="fas fa-hand-holding-heart"></i><span>Donate</span></a>
    <div class="bn-item" onclick="document.getElementById('openSidebarBtn').click()"><i class="fas fa-bars"></i><span>Menu</span></div>
</div>

<!-- Deferred Scripts for Instant Paint -->"""
rep("<!-- Deferred Scripts for Instant Paint -->", NAV, 1)

open(dst, "w", encoding="utf-8").write(h)
print("Done ->", dst)
if missed:
    print("WARNING: not found (file may differ):")
    for m in missed:
        print("  -", m)
