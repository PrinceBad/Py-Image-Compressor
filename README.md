# Py-Image: Real-Time Image Compressor 🖼️✨

A sleek, highly optimized, and purely client-side React application that allows users to batch-compress images, change formats, and resize dimensions. Inspired by clean, modern tools like Caesium, but built to run entirely in your browser with zero server uploads required, providing **real-time size estimations** before finalizing the compression.

## Live Demo
https://py-image-compressor.vercel.app/

## 🚀 Features

* **100% Secure & Private:** All image processing (resizing, formatting, compressing) happens entirely locally on your device. No images are ever uploaded to a remote server.
* **Real-Time Size Estimation:** Adjust the quality or scale sliders and instantly see the estimated final file size and savings percentage—before clicking compress.
* **Modern UI:** Features a premium deep-purple glassmorphism aesthetic with vibrant red/pink accents, built with Tailwind CSS.
* **Format Conversion:** Easily convert heavy PNGs or JPEGs into optimized WebP or JPEG formats.
* **Dimension Scaling:** Resize the physical dimensions of the image (10% to 100%) alongside compression quality.
* **Batch Processing & Direct Downloads:** Drag and drop multiple files, process them all at once with global settings, and download them directly to your machine.

## 🛠️ Tech Stack

* **Framework:** React (via Vite)
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Image Processing:** HTML5 `<canvas>` API & `FileReader` API
* **Deployment:** Vercel / Netlify / GitHub Pages

## 💻 Getting Started

To run this project locally on your machine, follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/py-image.git](https://github.com/YOUR_USERNAME/py-image.git)
   cd py-image
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 💡 How it Works (Under the Hood)

Py-Image leverages the browser's native capabilities to avoid server costs and latency:
1. **`FileReader`** loads the dropped images into memory.
2. A debounced **Background Task** draws the image to an off-screen HTML5 `<canvas>` whenever the user tweaks a slider.
3. `canvas.toBlob(callback, mimeType, quality)` is used to calculate the exact resulting byte size dynamically.
4. When the user clicks **Finalize & Download**, the blobs are converted into downloadable `URL.createObjectURL` links.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YOUR_USERNAME/py-image/issues).

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
