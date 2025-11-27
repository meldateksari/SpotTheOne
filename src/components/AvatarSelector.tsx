"use client";
import { useState } from "react";

const AVATARS = [
  "bear.png", "buffalo.png", "chick.png", "chicken.png", "cow.png",
  "crocodile.png", "dog.png", "duck.png", "elephant.png", "frog.png",
  "giraffe.png", "goat.png", "gorilla.png", "hippo.png", "horse.png",
  "monkey.png", "moose.png", "narwhal.png", "owl.png", "panda.png",
  "parrot.png", "penguin.png", "pig.png", "rabbit.png", "rhino.png",
  "sloth.png", "snake.png", "walrus.png", "whale.png", "zebra.png"
];

export default function AvatarSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange: (avatar: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-12 h-12 border border-gray-mid flex items-center justify-center hover:opacity-70 transition rounded"
      >
        {value ? (
          <img
            src={`/animals/${value}`}
            alt="avatar"
            className="w-10 h-10 object-contain"
          />
        ) : (
          <span className="text-xs text-gray-dark uppercase tracking-widest">
            AV
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white p-6 max-w-md w-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-sm mb-4 uppercase tracking-widest text-gray-dark">
              Choose Avatar
            </h2>

            <div className="grid grid-cols-4 gap-4 max-h-80 overflow-y-auto">
              {AVATARS.map((file) => (
                <button
                  key={file}
                  onClick={() => {
                    onChange(file);
                    setOpen(false);
                  }}
                  className="border border-gray-mid p-2 hover:border-black transition rounded"
                >
                  <img
                    src={`/animals/${file}`}
                    alt="avatar"
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full py-2 text-xs uppercase tracking-widest border border-black hover:bg-black hover:text-white transition rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
