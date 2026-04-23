interface DemoVideoProps {
  videoId: string;
}

const DemoVideo = ({ videoId }: DemoVideoProps) => (
  <section className="py-16 px-4">
    <p className="text-center text-amber-400 text-sm font-semibold uppercase tracking-wider mb-6">
      See it in 46 seconds
    </p>
    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-amber-500/10">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?vq=hd1080&rel=0&modestbranding=1&autoplay=0&controls=1&playsinline=1`}
        title="Excellion demo video"
        className="w-full h-full"
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  </section>
);

export default DemoVideo;
