function TutorBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg" data-name="tutor-banner" style={{ boxShadow: '0 10px 28px rgba(20,40,140,.25)' }}>
      <img src="assets/udom.jpg" alt="University of Dodoma" className="w-full h-40 sm:h-48 object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,26,122,.15) 0%,rgba(10,26,122,.55) 45%,rgba(10,26,122,.96) 100%)' }}></div>
      <div className="absolute left-0 right-0 bottom-0 px-3 pb-2">
        <div className="flex flex-col items-start gap-px leading-tight">
          <span className="inline-block px-1.5 py-px rounded-full text-[6px] font-extrabold tracking-[0.15em]" style={{ background: 'linear-gradient(180deg,#FFD24A,#F5A800)', color: '#0A1A7A' }}>
            TUTORIALS BY
          </span>
          <span className="text-[9px] font-bold text-white">Hashimu Shabani Halifa</span>
          <span className="text-[7px] font-semibold" style={{ color: '#FFD24A' }}>UDOM 2025 Finance Graduate</span>
          <a href="mailto:hashimushabani2001@gmail.com" className="text-[7px] text-white/90">hashimushabani2001@gmail.com</a>
          <a href="tel:+255617293971" className="text-[7px] text-white/90">+255 617 293 971</a>
        </div>
        <div className="mt-1.5 pt-1.5 text-center border-t border-white/20">
          <span className="hc-brand text-lg font-extrabold text-white tracking-tight">Hash<span className="gold">CLASS</span></span>
          <p className="hc-tag text-[10px] leading-none mt-0.5">The Golden Minds</p>
        </div>
      </div>
    </div>
  );
}
