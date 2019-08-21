package com.example.kotlinexperimental

import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.support.v7.widget.AppCompatImageView
import android.widget.ImageView
import android.widget.TextView
import java.util.*

class SecondActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_second)
        showRandomNumber()
    }

    companion object {
        const val TOTAL_COUNT = "any value, just for initializing"
    }

    private fun showRandomNumber () {
        // Get count from intent extras
        val count = intent.getIntExtra(TOTAL_COUNT, 0)

        // Generate Random Number
        val random = Random()
        var randomInt = 0

        // Add one because the bound is exclusive
        if (count > 0)
            randomInt = random.nextInt(count + 1)

        // Display Random Number
        findViewById<TextView>(R.id.textview_random).text = Integer.toString(randomInt)

        // Display Max Number
        findViewById<TextView>(R.id.textview_label).text = getString(R.string.random_heading, count)

        // If number is 1-6, display corresponding dice image
        val diceView = findViewById<ImageView>(R.id.diceImage)
        val diceResource = when (randomInt) {
            1 -> R.drawable.dice_1
            2 -> R.drawable.dice_2
            3 -> R.drawable.dice_3
            4 -> R.drawable.dice_4
            5 -> R.drawable.dice_5
            6 -> R.drawable.dice_6
            else -> R.drawable.empty_dice
        }
        diceView.setImageResource(diceResource)

    }
}
