package com.iskcon.hadapsar.santosh.in;

/** Pure-Java link policy, shared by notification taps and WebView navigation. */
public final class TempleUrlPolicy {
    public static final String HOME = "https://bjendermisra-ops.github.io/iskcon-mob/";
    private TempleUrlPolicy() {}
    public static String resolve(String input) {
        if (input == null || input.trim().isEmpty()) return HOME;
        String value = input.trim();
        if (value.length() > 8192 || value.indexOf('\\') >= 0) return null;
        for (int i=0;i<value.length();i++) if (Character.isISOControl(value.charAt(i))) return null;
        try {
            java.net.URI uri = new java.net.URI(HOME).resolve(value).normalize();
            String scheme = uri.getScheme();
            if (scheme == null || uri.getUserInfo() != null) return null;
            scheme = scheme.toLowerCase(java.util.Locale.ROOT);
            if (!(scheme.equals("https") || scheme.equals("http") || scheme.equals("tel") ||
                  scheme.equals("mailto") || scheme.equals("geo") || scheme.equals("market") ||
                  scheme.equals("intent") || scheme.equals("upi") || scheme.equals("whatsapp") ||
                  scheme.equals("phonepe") || scheme.equals("paytmmp") || scheme.equals("paytm") ||
                  scheme.equals("gpay") || scheme.equals("tez") || scheme.equals("bhim"))) return null;
            if ((scheme.equals("http") || scheme.equals("https")) && uri.getHost() == null) return null;
            return uri.toASCIIString();
        } catch (Exception ignored) { return null; }
    }
    public static boolean isInternal(String input) {
        String value = resolve(input);
        if (value == null) return false;
        try {
            java.net.URI u = new java.net.URI(value);
            if (!"https".equalsIgnoreCase(u.getScheme()) ||
                !"bjendermisra-ops.github.io".equalsIgnoreCase(u.getHost()) ||
                (u.getPort() != -1 && u.getPort() != 443) || u.getUserInfo() != null) return false;
            String p = u.getPath();
            // Reject encoded traversal, backslashes and ambiguous double encoding.
            if (p == null || p.indexOf('\\') >= 0 || p.indexOf('%') >= 0) return false;
            for (String part : p.split("/")) if (part.equals("..") || part.equals(".")) return false;
            return p.equals("/iskcon-mob") || p.startsWith("/iskcon-mob/");
        } catch (Exception ignored) { return false; }
    }
}
