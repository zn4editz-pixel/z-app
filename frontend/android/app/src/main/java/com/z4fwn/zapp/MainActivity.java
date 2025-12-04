package com.z4fwn.zapp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Splash screen will auto-hide after 2 seconds (configured in capacitor.config.json)
    }
}
