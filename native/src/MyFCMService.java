package com.iskcon.hadapsar.santosh.in;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MyFCMService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        try {
            String title = "मंदिर सूचना";
            String body = "आपके लिए एक नया संदेश है।";
            String imageUrl = null;
            String targetPage = "index.html";
            boolean openOutside = false;
            String soundMode = "normal"; // default: normal | loud | silent
            String btnText = null;
            int notificationId = (int) System.currentTimeMillis();

            // 📥 1. DATA PAYLOAD PARSING
            if (remoteMessage.getData() != null && !remoteMessage.getData().isEmpty()) {
                if (remoteMessage.getData().get("title") != null) title = remoteMessage.getData().get("title");
                if (remoteMessage.getData().get("body") != null) body = remoteMessage.getData().get("body");
                if (remoteMessage.getData().get("message") != null) body = remoteMessage.getData().get("message");
                
                // इमेज लिंक
                if (remoteMessage.getData().get("image") != null) imageUrl = remoteMessage.getData().get("image");
                if (remoteMessage.getData().get("imageUrl") != null) imageUrl = remoteMessage.getData().get("imageUrl");
                if (remoteMessage.getData().get("img") != null) imageUrl = remoteMessage.getData().get("img");

                // टारगेट पेज (क्लिक करने पर ऐप में कौन सा पेज खुलेगा)
                if (remoteMessage.getData().get("page") != null) targetPage = remoteMessage.getData().get("page");
                if (remoteMessage.getData().get("url") != null) targetPage = remoteMessage.getData().get("url");
                if (remoteMessage.getData().get("target_page") != null) targetPage = remoteMessage.getData().get("target_page");
                if (remoteMessage.getData().get("targetUrl") != null) targetPage = remoteMessage.getData().get("targetUrl");
                if (remoteMessage.getData().get("target_url") != null) targetPage = remoteMessage.getData().get("target_url");
                if (remoteMessage.getData().get("link") != null) targetPage = remoteMessage.getData().get("link");
                if (remoteMessage.getData().get("OPEN_URL") != null) targetPage = remoteMessage.getData().get("OPEN_URL");
                openOutside = "false".equalsIgnoreCase(remoteMessage.getData().get("open_in_app")) || "external".equalsIgnoreCase(remoteMessage.getData().get("target_type"));

                // बटन का नाम
                if (remoteMessage.getData().get("btn_text") != null) btnText = remoteMessage.getData().get("btn_text");

                // 🔊 साउंड मोड्स
                if (remoteMessage.getData().get("sound") != null) soundMode = remoteMessage.getData().get("sound").toLowerCase();
                if (remoteMessage.getData().get("sound_mode") != null) soundMode = remoteMessage.getData().get("sound_mode").toLowerCase();
                if ("true".equalsIgnoreCase(remoteMessage.getData().get("is_loud"))) soundMode = "loud";
                if ("true".equalsIgnoreCase(remoteMessage.getData().get("is_silent"))) soundMode = "silent";

                // कस्टम नोटिफिकेशन ID
                if (remoteMessage.getData().get("id") != null) {
                    try { notificationId = Integer.parseInt(remoteMessage.getData().get("id")); } catch (Exception ignored) {}
                }
            } else if (remoteMessage.getNotification() != null) {
                if (remoteMessage.getNotification().getTitle() != null) title = remoteMessage.getNotification().getTitle();
                if (remoteMessage.getNotification().getBody() != null) body = remoteMessage.getNotification().getBody();
                if (remoteMessage.getNotification().getImageUrl() != null) imageUrl = remoteMessage.getNotification().getImageUrl().toString();
            }

            final String finalTitle = title;
            final String finalBody = body;
            final String finalImage = imageUrl;
            final String finalTargetPage = targetPage;
            final boolean finalOpenOutside = openOutside;
            final String finalSoundMode = soundMode;
            final String finalBtnText = btnText;
            final int finalNotifId = notificationId;

            new Thread(new Runnable() {
                @Override
                public void run() {
                    displaySmartNotification(finalTitle, finalBody, finalImage, finalTargetPage, finalSoundMode, finalBtnText, finalNotifId, finalOpenOutside);
                }
            }).start();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void displaySmartNotification(String title, String body, String imageUrl, String targetPage, String soundMode, String btnText, int notifId, boolean openOutside) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // 1. अगर लाउड मोड है तो स्क्रीन को ऑन करो और वॉल्यूम 100% करो
            if ("loud".equals(soundMode) || "alarm".equals(soundMode)) {
                try {
                    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                    if (pm != null) {
                        PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "APP:FCMWake");
                        wl.acquire(6000);
                    }
                } catch (Exception ignored) {}

                try {
                    AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                    if (am != null) {
                        int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                        am.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0);
                    }
                } catch (Exception ignored) {}
            }

            // 2. चैनल व प्रायोरिटी चयन
            String channelId = "rk_normal_v2";
            int priority = NotificationCompat.PRIORITY_HIGH;
            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            if ("loud".equals(soundMode) || "alarm".equals(soundMode)) {
                channelId = "padyatra_loud_v5";
                priority = NotificationCompat.PRIORITY_MAX;
                int customSoundId = getResources().getIdentifier("temple_alarm", "raw", getPackageName());
                if (customSoundId == 0) customSoundId = getResources().getIdentifier("iskcon_alarm", "raw", getPackageName());
                soundUri = (customSoundId != 0) ? Uri.parse("android.resource://" + getPackageName() + "/" + customSoundId) : RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            } else if ("silent".equals(soundMode) || "mute".equals(soundMode)) {
                channelId = "rk_silent_v2";
                priority = NotificationCompat.PRIORITY_LOW;
                soundUri = null;
            }

            // 3. Android 8.0+ चैनल क्रिएशन
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = nm.getNotificationChannel(channelId);
                if (channel == null) {
                    if ("loud".equals(soundMode) || "alarm".equals(soundMode)) {
                        channel = new NotificationChannel(channelId, "अति महत्वपूर्ण सूचनाएं (Loud Alerts)", NotificationManager.IMPORTANCE_HIGH);
                        channel.setDescription("महत्वपूर्ण सूचनाएं एवं आरती दर्शन");
                        channel.enableLights(true);
                        channel.setLightColor(Color.parseColor("#FF9933"));
                        channel.enableVibration(true);
                        channel.setBypassDnd(true);
                        AudioAttributes aa = new AudioAttributes.Builder()
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .setUsage(AudioAttributes.USAGE_ALARM).build();
                        channel.setSound(soundUri, aa);
                    } else if ("silent".equals(soundMode) || "mute".equals(soundMode)) {
                        channel = new NotificationChannel(channelId, "शांत सूचनाएं (Silent Updates)", NotificationManager.IMPORTANCE_LOW);
                        channel.setDescription("बिना आवाज की दैनिक सूचनाएं");
                        channel.enableVibration(false);
                        channel.setSound(null, null);
                    } else {
                        channel = new NotificationChannel(channelId, "सामान्य मंदिर सूचनाएं", NotificationManager.IMPORTANCE_HIGH);
                        channel.setDescription("दैनिक दर्शन एवं सामान्य सूचनाएं");
                        channel.enableLights(true);
                        channel.setLightColor(Color.parseColor("#FF9933"));
                        channel.enableVibration(true);
                    }
                    nm.createNotificationChannel(channel);
                }
            }

            // 4. ऐप खोलने वाला इंटेंट
            Intent openIntent = TempleLinkRouter.notificationIntent(this, targetPage, openOutside);

            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) piFlags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getActivity(this, notifId, openIntent, piFlags);

            int iconId = getApplicationInfo().icon;
            if (iconId == 0) iconId = android.R.drawable.sym_def_app_icon;

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                    .setSmallIcon(iconId)
                    .setColor(Color.parseColor("#FF9933"))
                    .setContentTitle(title)
                    .setContentText(body)
                    .setPriority(priority)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

            String actionBtnText = (btnText != null && !btnText.trim().isEmpty()) ? btnText : "खोलें / देखें 🙏";

            if ("loud".equals(soundMode) || "alarm".equals(soundMode)) {
                builder.setCategory(NotificationCompat.CATEGORY_ALARM);
                builder.setSound(soundUri, AudioManager.STREAM_ALARM);
                builder.setFullScreenIntent(pendingIntent, true);
                builder.addAction(iconId, actionBtnText, pendingIntent);
            } else if ("silent".equals(soundMode) || "mute".equals(soundMode)) {
                builder.setSound(null);
                builder.setVibrate(new long[]{0L});
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    builder.setNotificationSilent();
                }
            } else {
                builder.setDefaults(NotificationCompat.DEFAULT_ALL);
                builder.addAction(iconId, actionBtnText, pendingIntent);
            }

            // 5. इमेज सपोर्ट (BigPictureStyle)
            if (imageUrl != null && imageUrl.startsWith("http")) {
                Bitmap bigImage = downloadImageBitmap(imageUrl);
                if (bigImage != null) {
                    builder.setLargeIcon(bigImage);
                    builder.setStyle(new NotificationCompat.BigPictureStyle().bigPicture(bigImage).setSummaryText(body));
                } else {
                    builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));
                }
            } else {
                builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));
            }

            nm.notify(notifId, builder.build());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private Bitmap downloadImageBitmap(String urlStr) {
        HttpURLConnection conn = null;
        InputStream in = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(8000);
            conn.setDoInput(true);
            conn.connect();
            in = conn.getInputStream();
            return BitmapFactory.decodeStream(in);
        } catch (Exception e) {
            return null;
        } finally {
            try { if (in != null) in.close(); } catch (Exception ignored) {}
            try { if (conn != null) conn.disconnect(); } catch (Exception ignored) {}
        }
    }
}