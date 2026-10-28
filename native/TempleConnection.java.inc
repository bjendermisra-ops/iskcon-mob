// Insert as MainActivity member code (Sketchware extra_functions).
private final class TempleConnection implements android.app.Application.ActivityLifecycleCallbacks {
    private final android.webkit.WebView web;
    private final android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final android.widget.LinearLayout cover;
    private final android.widget.TextView title;
    private final android.widget.Button retry;
    private final android.widget.Button books;
    private android.net.ConnectivityManager manager;
    private android.net.ConnectivityManager.NetworkCallback callback;
    private String pending = "https://bjendermisra-ops.github.io/iskcon-mob/";
    private boolean failed, destroyed, loading;
    private int generation;
    private final Runnable timeout = new Runnable() {
        @Override public void run() { if (loading) error("Page is taking too long. Please retry."); }
    };
    TempleConnection(android.webkit.WebView view) {
        web = view;
        web.setBackgroundColor(0xFFFFF8EE);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(0xFFFFF8EE));
        android.view.ViewGroup parent = (android.view.ViewGroup) web.getParent();
        int index = parent.indexOfChild(web);
        android.view.ViewGroup.LayoutParams params = web.getLayoutParams();
        parent.removeView(web);
        android.widget.FrameLayout frame = new android.widget.FrameLayout(MainActivity.this);
        parent.addView(frame, index, params);
        frame.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
        cover = new android.widget.LinearLayout(MainActivity.this);
        cover.setOrientation(1); cover.setGravity(android.view.Gravity.CENTER);
        cover.setPadding(32,32,32,32); cover.setBackgroundColor(0xFFFFF8EE);
        cover.setClickable(true);
        title = new android.widget.TextView(MainActivity.this);
        title.setTextColor(0xFF663314); title.setTextSize(20); title.setGravity(17);
        cover.addView(title, new android.widget.LinearLayout.LayoutParams(-1,-2));
        retry = new android.widget.Button(MainActivity.this); retry.setText("Retry / दोबारा कोशिश करें");
        cover.addView(retry);
        books = new android.widget.Button(MainActivity.this); books.setText("Offline books / पुस्तकें");
        cover.addView(books);
        frame.addView(cover, new android.widget.FrameLayout.LayoutParams(-1,-1));
        retry.setOnClickListener(new android.view.View.OnClickListener() {
            @Override public void onClick(android.view.View v) { reload(); }
        });
        books.setOnClickListener(new android.view.View.OnClickListener() {
            @Override public void onClick(android.view.View v) {
                startActivity(new android.content.Intent(MainActivity.this, EbookActivity.class));
            }
        });
        manager = (android.net.ConnectivityManager) getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
        callback = new android.net.ConnectivityManager.NetworkCallback() {
            @Override public void onCapabilitiesChanged(android.net.Network n, android.net.NetworkCapabilities c) {
                if (c.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                    handler.post(new Runnable() { @Override public void run() {
                        if (!destroyed && validated()) { notifyWeb(); if (failed) reload(); }
                    }});
                }
            }
            @Override public void onLost(android.net.Network n) {
                handler.post(new Runnable() { @Override public void run() { if (!destroyed) notifyWeb(); }});
            }
        };
        try { if (manager != null) manager.registerDefaultNetworkCallback(callback); } catch (Exception ignored) {}
        getApplication().registerActivityLifecycleCallbacks(this);
        started(pending);
    }
    boolean validated() {
        try {
            android.net.NetworkCapabilities c = manager.getNetworkCapabilities(manager.getActiveNetwork());
            return c != null && c.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        } catch (Exception e) { return false; }
    }
    void notifyWeb() {
        if (!destroyed) web.evaluateJavascript("window.dispatchEvent(new Event('temple-network'));", null);
    }
    void started(String url) {
        if (destroyed) return;
        pending = url; generation++; failed = false; loading = true;
        title.setText("हरे कृष्ण 🙏\nLoading…");
        retry.setVisibility(android.view.View.GONE); books.setVisibility(android.view.View.GONE);
        cover.setVisibility(android.view.View.VISIBLE);
        handler.removeCallbacks(timeout); handler.postDelayed(timeout, 20000);
    }
    void ready(String url) {
        if (destroyed || failed || !url.equals(pending)) return;
        final int ticket = generation;
        web.postVisualStateCallback(ticket, new android.webkit.WebView.VisualStateCallback() {
            @Override public void onComplete(long requestId) {
                if (!destroyed && !failed && ticket == generation) {
                    loading = false; handler.removeCallbacks(timeout);
                    cover.setVisibility(android.view.View.GONE);
                }
            }
        });
    }
    void error(String message) {
        if (destroyed) return;
        failed = true; loading = false; generation++;
        handler.removeCallbacks(timeout); web.stopLoading();
        title.setText(message);
        retry.setVisibility(android.view.View.VISIBLE); books.setVisibility(android.view.View.VISIBLE);
        cover.setVisibility(android.view.View.VISIBLE);
    }
    void networkError() {
        error(validated() ? "Temple page could not be reached. Please retry." :
            "No working internet connection.\nWi-Fi / mobile data जाँचें, फिर Retry करें।");
    }
    void reload() {
        if (destroyed || loading) return;
        String target = pending;
        started(target); web.loadUrl(target);
    }
    @Override public void onActivityResumed(android.app.Activity a) {
        if (a == MainActivity.this && !destroyed) {
            notifyWeb(); if (failed && validated()) reload();
        }
    }
    @Override public void onActivityDestroyed(android.app.Activity a) {
        if (a != MainActivity.this) return;
        destroyed = true; handler.removeCallbacksAndMessages(null);
        try { if (manager != null) manager.unregisterNetworkCallback(callback); } catch (Exception ignored) {}
        getApplication().unregisterActivityLifecycleCallbacks(this);
    }
    @Override public void onActivityCreated(android.app.Activity a, android.os.Bundle b) {}
    @Override public void onActivityStarted(android.app.Activity a) {}
    @Override public void onActivityPaused(android.app.Activity a) {}
    @Override public void onActivityStopped(android.app.Activity a) {}
    @Override public void onActivitySaveInstanceState(android.app.Activity a, android.os.Bundle b) {}
}
