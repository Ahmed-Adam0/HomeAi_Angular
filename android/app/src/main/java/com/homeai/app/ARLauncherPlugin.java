package com.homeai.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ARLauncher")
public class ARLauncherPlugin extends Plugin {
    private static final String TAG = "ARLauncher";

    @PluginMethod
    public void checkARSupport(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        boolean isInstalled = false;
        
        Log.d(TAG, "========== checkARSupport() DIAGNOSTICS ==========");
        Log.d(TAG, "1. Context package name: " + getContext().getPackageName());
        Log.d(TAG, "2. Android SDK version: " + android.os.Build.VERSION.SDK_INT);
        
        Log.d(TAG, "3. Dumping installed packages containing 'ar':");
        java.util.List<android.content.pm.PackageInfo> packages = pm.getInstalledPackages(0);
        for (android.content.pm.PackageInfo pi : packages) {
            if (pi.packageName.toLowerCase().contains("ar")) {
                Log.d(TAG, "   Found: " + pi.packageName);
            }
        }
        
        Log.d(TAG, "4. Calling getPackageInfo(\"com.google.ar.core\", 0)");
        try {
            android.content.pm.PackageInfo info = pm.getPackageInfo("com.google.ar.core", 0);
            isInstalled = true;
            Log.d(TAG, "   getPackageInfo() SUCCESS. VersionCode: " + info.versionCode);
        } catch (Exception e) {
            isInstalled = false;
            Log.e(TAG, "5. Exception Class: " + e.getClass().getName());
            Log.e(TAG, "6. Exception Message: " + e.getMessage());
            Log.e(TAG, "7. Stack Trace:", e);
        }
        
        Log.d(TAG, "==================================================");

        JSObject ret = new JSObject();
        ret.put("supported", isInstalled);
        call.resolve(ret);
    }

    @PluginMethod
    public void launchAR(PluginCall call) {
        Log.d(TAG, "1. launchAR() entered");
        
        String glbUrl = call.getString("glbUrl");
        if (glbUrl == null) {
            Log.e(TAG, "glbUrl is null. Rejecting call.");
            call.reject("Must provide glbUrl");
            return;
        }
        Log.d(TAG, "2. Received glbUrl: " + glbUrl);

        try {
            Log.d(TAG, "3. Constructing official Scene Viewer Intent");
            Intent intent = new Intent(Intent.ACTION_VIEW);
            
            // Build the official URI
            Uri dataUri = Uri.parse("https://arvr.google.com/scene-viewer/1.0?file=" + glbUrl + "&mode=ar_only");
            intent.setData(dataUri);
            intent.setPackage("com.google.ar.core");

            Log.d(TAG, "--- Pre-launch Intent Diagnostics ---");
            Log.d(TAG, "1. glbUrl: " + glbUrl);
            Log.d(TAG, "2. intent.getData(): " + intent.getData());
            Log.d(TAG, "3. intent.getPackage(): " + intent.getPackage());
            Log.d(TAG, "5. intent.toUri(0): " + intent.toUri(0));

            Log.d(TAG, "4. intent.resolveActivity(packageManager)...");
            PackageManager pm = getContext().getPackageManager();
            ResolveInfo info = pm.resolveActivity(intent, 0);

            if (info != null) {
                Log.d(TAG, "6. resolveActivity() SUCCESS. Target: " + info.activityInfo.packageName + " / " + info.activityInfo.name);
                Log.d(TAG, "8. Immediately before startActivity()");
                getContext().startActivity(intent);
                Log.d(TAG, "9. Immediately after startActivity()");
                call.resolve();
            } else {
                Log.e(TAG, "6. resolveActivity() returned NULL");
                Log.e(TAG, "DUMPING exported activities for com.google.ar.core handling ACTION_VIEW:");
                
                Intent testIntent = new Intent(Intent.ACTION_VIEW);
                testIntent.setPackage("com.google.ar.core");
                java.util.List<ResolveInfo> activities = pm.queryIntentActivities(testIntent, 0);
                
                if (activities != null && !activities.isEmpty()) {
                    for (ResolveInfo ri : activities) {
                        Log.e(TAG, "Found: " + ri.activityInfo.name);
                    }
                } else {
                    Log.e(TAG, "No activities found in com.google.ar.core handling ACTION_VIEW. Package might be missing or restricted.");
                }
                
                call.reject("Scene Viewer cannot resolve the exact intent. See Logcat for details.");
            }
        } catch (android.content.ActivityNotFoundException e) {
            Log.e(TAG, "10. ActivityNotFoundException: Scene Viewer is not installed or unavailable.", e);
            call.reject("Scene Viewer is unavailable on this device.");
        } catch (Exception e) {
            Log.e(TAG, "11. Exception caught during launchAR: " + e.getMessage(), e);
            call.reject("Failed to parse or launch intent: " + e.getMessage());
        }
    }
}
