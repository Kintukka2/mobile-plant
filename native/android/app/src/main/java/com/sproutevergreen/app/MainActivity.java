package com.sproutevergreen.app;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /* The screen stays on while Sprout is in front. The planner's
       walkthrough and the guided tour play hands-free, and a home is drawn
       with long pauses between rooms; a phone that dimmed and locked half
       way through either lost the reader's place. The flag belongs to this
       window, so it ends the moment another app or the lock button takes
       the screen, and it needs no permission. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
