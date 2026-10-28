package com.iskcon.hadapsar.santosh.in;

/** Android handoff; no external document is loaded into the privileged WebView. */
public final class TempleLinkRouter {
    private TempleLinkRouter() {}
    private static android.content.Intent view(String url) {
        android.content.Intent i = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
        i.addCategory(android.content.Intent.CATEGORY_BROWSABLE);
        return i;
    }
    public static String target(android.content.Intent i) {
        if (i == null) return null;
        for (String key : new String[]{"target_page","targetUrl","target_url","OPEN_URL","url","page","link"}) {
            String value = i.getStringExtra(key);
            if (value != null && !value.trim().isEmpty()) return value;
        }
        return i.getDataString();
    }
    public static boolean forceExternal(android.content.Intent i) {
        if (i == null || i.getExtras() == null) return false;
        Object mode = i.getExtras().get("open_in_app");
        return Boolean.FALSE.equals(mode) || "false".equalsIgnoreCase(String.valueOf(mode)) ||
            "external".equalsIgnoreCase(i.getStringExtra("target_type"));
    }
    private static String preferredPackage(android.net.Uri u) {
        String host = u.getHost(); if (host == null) return null;
        host = host.toLowerCase(java.util.Locale.ROOT);
        if (host.equals("youtube.com") || host.endsWith(".youtube.com") || host.equals("youtu.be")) return "com.google.android.youtube";
        if (host.equals("instagram.com") || host.endsWith(".instagram.com")) return "com.instagram.android";
        if (host.equals("whatsapp.com") || host.endsWith(".whatsapp.com") || host.equals("wa.me")) return "com.whatsapp";
        if (host.equals("play.google.com")) return "com.android.vending";
        return null;
    }
    public static android.content.Intent externalIntent(android.content.Context c, String input) {
        String url = TempleUrlPolicy.resolve(input);
        if (url == null) return null;
        android.content.Intent i;
        if (url.regionMatches(true, 0, "intent:", 0, 7)) {
            try {
                android.content.Intent parsed = android.content.Intent.parseUri(url, android.content.Intent.URI_INTENT_SCHEME);
                String data = parsed.getDataString();
                String safe = TempleUrlPolicy.resolve(data);
                if (data == null || safe == null || safe.regionMatches(true,0,"intent:",0,7)) return null;
                // Rebuild rather than trusting intent flags, components or arbitrary extras.
                i = view(safe);
                String pkg = parsed.getPackage();
                if (pkg != null && (pkg.equals("com.google.android.youtube") || pkg.equals("com.instagram.android") ||
                    pkg.equals("com.google.android.apps.maps") || pkg.equals("com.whatsapp"))) i.setPackage(pkg);
                if (i.resolveActivity(c.getPackageManager()) == null) {
                    String fallback = parsed.getStringExtra("browser_fallback_url");
                    String resolved = fallback == null ? null : TempleUrlPolicy.resolve(fallback);
                    if (resolved != null && resolved.startsWith("https://")) i = view(resolved);
                    else i.setPackage(null);
                }
            } catch (Exception e) { return null; }
        } else {
            i = view(url);
            String pkg = preferredPackage(i.getData());
            if (pkg != null) {
                // No dependency on package visibility: startActivity catches missing apps below.
                i.setPackage(pkg);
            }
        }
        return i;
    }
    public static void openExternal(android.content.Context c, String url) {
        android.content.Intent i = externalIntent(c, url);
        if (i == null) { message(c); return; }
        if (!(c instanceof android.app.Activity)) i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        try { c.startActivity(i); }
        catch (Exception first) {
            try {
                i.setPackage(null);
                if (i.getData() != null && "market".equals(i.getData().getScheme())) {
                    String id = i.getData().getQueryParameter("id");
                    if (id == null) id = c.getPackageName();
                    i.setData(android.net.Uri.parse("https://play.google.com/store/apps/details?id=" + android.net.Uri.encode(id)));
                }
                c.startActivity(i);
            } catch (Exception second) { message(c); }
        }
    }
    public static android.content.Intent notificationIntent(android.content.Context c, String input, boolean external) {
        String url = TempleUrlPolicy.resolve(input);
        if (url != null && (external || !TempleUrlPolicy.isInternal(url))) {
            android.content.Intent out = externalIntent(c,url);
            // PendingIntent cannot catch launch failures. Let Android resolve HTTPS to app or browser.
            if (out != null) { out.setPackage(null); out.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK); return out; }
        }
        android.content.Intent in = new android.content.Intent(c, MainActivity.class);
        in.putExtra("target_page", url != null && TempleUrlPolicy.isInternal(url) ? url : TempleUrlPolicy.HOME);
        in.addFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP | android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return in;
    }
    private static void message(android.content.Context c) {
        android.widget.Toast.makeText(c,"Cannot open this link. Please install a suitable app.",android.widget.Toast.LENGTH_LONG).show();
    }
}
