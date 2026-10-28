private boolean routeTempleUrl(String input) {
    if (input == null) return true;
    android.net.Uri raw = android.net.Uri.parse(input);
    if ("app://reload".equals(input)) { webview1.reload(); return true; }
    if ("action_share".equals(raw.getHost())) { triggerNativeShare(raw.getQueryParameter("lang")); return true; }
    String url = TempleUrlPolicy.resolve(input);
    if (url == null) return true;
    if (TempleUrlPolicy.isInternal(url)) return false;
    TempleLinkRouter.openExternal(this,url);
    return true;
}
private void consumeTempleIntent(android.content.Intent intent, boolean coldStart) {
    String raw = TempleLinkRouter.target(intent);
    String url = raw == null ? null : TempleUrlPolicy.resolve(raw);
    if (url != null && TempleUrlPolicy.isInternal(url) && !TempleLinkRouter.forceExternal(intent)) {
        webview1.loadUrl(url);
    } else {
        if (coldStart) webview1.loadUrl(TempleUrlPolicy.HOME);
        if (url != null) TempleLinkRouter.openExternal(this,url);
        else if (raw != null) android.widget.Toast.makeText(this,"Invalid notification link",android.widget.Toast.LENGTH_SHORT).show();
    }
}
@Override protected void onNewIntent(android.content.Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    consumeTempleIntent(intent,false);
}
