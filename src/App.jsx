import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";
import { Footer } from "./components/Footer.jsx";
import { ReadyStockTicker } from "./components/ReadyStockTicker.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Categories from "./pages/Categories.jsx";
import Enquiry from "./pages/Enquiry.jsx";
import Account from "./pages/Account.jsx";
import Blog from "./pages/Blog.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import "./index.css";
export default function App() {
  const [lang, setLang] = useState("EN");
  const [cart, setCart] = useState([]);
  function addToCart(product) {
    setCart(prev => prev.find(p => p.id === product.id) ? prev : [...prev, product]);
  }
  function removeFromCart(id) { setCart(prev => prev.filter(p => p.id !== id)); }
  function clearCart() { setCart([]); }
  return (
    <BrowserRouter>
      <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        <Navbar lang={lang} setLang={setLang} cartCount={cart.length}/>
        <main style={{ flex:1 }}>
          <Routes>
            <Route path="/" element={<Home lang={lang} cart={cart} onAddToCart={addToCart}/>}/>
            <Route path="/products" element={<Products lang={lang} cart={cart} onAddToCart={addToCart}/>}/>
            <Route path="/products/:slug" element={<ProductDetail cart={cart} onAddToCart={addToCart}/>}/>
            <Route path="/categories" element={<Categories/>}/>
            <Route path="/enquiry" element={<Enquiry lang={lang} cart={cart} onRemoveFromCart={removeFromCart} onClearCart={clearCart}/>}/>
            <Route path="/account" element={<Account/>}/>
            <Route path="/blog" element={<Blog/>}/>
            <Route path="/blog/:slug" element={<BlogPost/>}/>
            <Route path="/about" element={<About/>}/>
            <Route path="/contact" element={<Contact/>}/>
            <Route path="*" element={
              <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:64, color:"#e2e8f0" }}>404</div>
                <div style={{ color:"#64748b" }}>Page not found</div>
                <a href="/" style={{ color:"#1877F2", fontSize:13 }}>← Back to home</a>
              </div>
            }/>
          </Routes>
        </main>
        <Footer/>
        {/* Fixed bottom ticker — shows only when ready stock products exist */}
        <ReadyStockTicker/>
      </div>
    </BrowserRouter>
  );
}
