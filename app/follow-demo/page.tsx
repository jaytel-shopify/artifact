"use client";

import { useState } from "react";
import QuickFollowProvider, {
  useFollow,
} from "@/components/QuickFollowProvider";
import FollowControlPanel from "@/components/follow/FollowControlPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function DemoContent() {
  const { isLeading, broadcastCustomEvent } = useFollow();
  const [inputValue, setInputValue] = useState("");
  const [counter, setCounter] = useState(0);

  const handleCustomEvent = () => {
    if (isLeading) {
      broadcastCustomEvent("demo-button-click", {
        timestamp: Date.now(),
        counter: counter + 1,
      });
    }
    setCounter(counter + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">Quick Follow Feature Demo</h1>
          <p className="text-xl text-gray-600">
            Test the real-time follow functionality with multiple users
          </p>
        </div>

        {/* Instructions */}
        <Card className="p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-bold mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>
              Open this page in multiple browser tabs or share with colleagues
            </li>
            <li>In one tab, click "Start Leading" to broadcast your actions</li>
            <li>In another tab, click "Follow User" and select the leader</li>
            <li>
              Interact with the page - scroll, click, type - and watch it sync!
            </li>
          </ol>
        </Card>

        {/* Interactive Elements */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scroll Demo */}
          <Card className="p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold mb-4">Scroll Test</h3>
            <p className="mb-4 text-gray-600">
              Scroll this page to see scroll synchronization in action.
            </p>
            <div className="h-64 overflow-y-auto border-2 border-black p-4 bg-white">
              <p className="mb-4">Scroll me!</p>
              {Array.from({ length: 20 }).map((_, i) => (
                <p key={i} className="mb-2">
                  Line {i + 1} - Lorem ipsum dolor sit amet consectetur
                </p>
              ))}
            </div>
          </Card>

          {/* Click Demo */}
          <Card className="p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold mb-4">Click Test</h3>
            <p className="mb-4 text-gray-600">
              Click buttons to see click synchronization and highlighting.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => alert("Button 1 clicked!")}
                className="w-full"
                variant="default"
              >
                Click Me - Button 1
              </Button>
              <Button
                onClick={() => alert("Button 2 clicked!")}
                className="w-full"
                variant="outline"
              >
                Click Me - Button 2
              </Button>
              <Button
                onClick={handleCustomEvent}
                className="w-full"
                variant="outline"
              >
                Custom Event Counter: {counter}
              </Button>
            </div>
          </Card>

          {/* Input Demo */}
          <Card className="p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold mb-4">Input Test</h3>
            <p className="mb-4 text-gray-600">
              Type in the fields to see input synchronization.
            </p>
            <div className="space-y-3">
              <Input
                placeholder="Type something..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <textarea
                className="w-full p-2 border-2 border-black rounded resize-none"
                rows={4}
                placeholder="Type in this text area..."
              />
            </div>
          </Card>

          {/* Navigation Demo */}
          <Card className="p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold mb-4">Navigation Test</h3>
            <p className="mb-4 text-gray-600">
              Navigation events will be synchronized when following a leader.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full"
                variant="outline"
              >
                Scroll to Top
              </Button>
              <Button
                onClick={() =>
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  })
                }
                className="w-full"
                variant="outline"
              >
                Scroll to Bottom
              </Button>
            </div>
          </Card>
        </div>

        {/* Color Grid for Click Testing */}
        <Card className="p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">Color Grid Click Test</h3>
          <p className="mb-4 text-gray-600">
            Click on colors to test element selection and click highlighting.
          </p>
          <div className="grid grid-cols-8 gap-2">
            {[
              "bg-red-500",
              "bg-orange-500",
              "bg-yellow-500",
              "bg-green-500",
              "bg-blue-500",
              "bg-indigo-500",
              "bg-purple-500",
              "bg-pink-500",
              "bg-red-400",
              "bg-orange-400",
              "bg-yellow-400",
              "bg-green-400",
              "bg-blue-400",
              "bg-indigo-400",
              "bg-purple-400",
              "bg-pink-400",
            ].map((color, i) => (
              <button
                key={i}
                className={`${color} h-16 border-2 border-black hover:scale-110 transition-transform`}
                onClick={() => console.log(`Clicked ${color}`)}
              />
            ))}
          </div>
        </Card>

        {/* Status Info */}
        <Card className="p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-gray-50">
          <h3 className="text-xl font-bold mb-4">Technical Details</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Room:</strong> follow
            </p>
            <p>
              <strong>Captured Events:</strong> Scroll, Click, Input
            </p>
            <p>
              <strong>Features:</strong> Smooth scroll, Click highlighting,
              Throttling
            </p>
            <p>
              <strong>WebSocket:</strong> quick.socket via Quick infrastructure
            </p>
          </div>
        </Card>

        {/* Add some height for scroll testing */}
        <div className="h-64"></div>
      </div>
    </div>
  );
}

export default function FollowDemoPage() {
  return (
    <QuickFollowProvider roomName="follow-demo">
      <DemoContent />
      <FollowControlPanel />
    </QuickFollowProvider>
  );
}
