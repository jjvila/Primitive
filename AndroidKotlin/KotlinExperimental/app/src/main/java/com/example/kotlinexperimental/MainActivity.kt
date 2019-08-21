package com.example.kotlinexperimental

import android.content.Intent
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast

class MainActivity : AppCompatActivity() {

    //findViewById is an expensive operation. Call it once and store it here
    lateinit var showCountTextView : TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        showCountTextView = findViewById<TextView>(R.id.textView3)
    }
    fun toastMe(view: View) {
        val myToast = Toast.makeText(this, "Hello!", Toast.LENGTH_SHORT)
        myToast.show()
    } // Note: Passing view required due to method being invoked by clicking a View

    fun incrementNum(view: View) {
        // Get the value of the text view
        val countString = showCountTextView.text.toString()

        // Convert value to a number and increment it
        var count: Int = Integer.parseInt(countString)
        count++

        // Display the new value in the text view
        showCountTextView.text = count.toString()
    }

    fun decrementNum(view: View) {
        val countString = showCountTextView.text.toString()
        var count: Int = Integer.parseInt(countString)

        if(count > 0)
            count--

        // Display the new value in the ext view
        showCountTextView.text = count.toString()
    }

    fun randomMe(view: View) {

        // Get count from TextView
        val countString = showCountTextView.text.toString()
        var count: Int = Integer.parseInt(countString)

        // Create an Intent to start the Second Activity
        val randomIntent = Intent(this, SecondActivity::class.java)

        // Put extra info to pass
        randomIntent.putExtra(SecondActivity.TOTAL_COUNT, count)

        // Start the new Activity.
        startActivity(randomIntent)
    }

    // Reset the count back to zero
    fun clearCount(view: View) {
        showCountTextView.text = Integer.toString(0)
    }
}
