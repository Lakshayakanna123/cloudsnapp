import { Link } from 'react-router-dom';
import { Camera, Shield, Zap, Globe, Upload, Star, ArrowRight, Cloud, Lock, Image } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    desc: 'Cognito authentication, JWT-authorized API, and private S3 storage with no direct public access.',
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Zap,
    title: 'Instant Thumbnails',
    desc: 'Automatic thumbnail generation via AWS Lambda + Sharp. Photos appear in your gallery in seconds.',
    color: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: Globe,
    title: 'Global CDN Delivery',
    desc: 'CloudFront distributes thumbnails from edge locations worldwide for ultra-fast load times.',
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: Upload,
    title: 'Direct S3 Uploads',
    desc: 'Pre-signed URLs let you upload files directly to S3 — no file ever passes through our servers.',
    color: 'from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: Star,
    title: 'Albums & Favorites',
    desc: 'Organize your photos into collections, mark favorites, and find anything instantly with search.',
    color: 'from-rose-500/20 to-pink-500/10',
    iconColor: 'text-rose-400',
  },
  {
    icon: Lock,
    title: 'Your Photos, Your Data',
    desc: 'Every API call is ownership-verified. Other users can never access, view, or delete your files.',
    color: 'from-primary-500/20 to-indigo-500/10',
    iconColor: 'text-primary-400',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 bg-surface-950/80 backdrop-blur-md border-b border-surface-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">CloudSnap</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-6">
            <Cloud className="w-3.5 h-3.5" />
            Powered by AWS · Serverless · TypeScript
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-[1.1] tracking-tight">
            Your photos.<br />
            <span className="text-gradient">Secured in the cloud.</span>
          </h1>

          <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            CloudSnap is a professional cloud photo gallery built on AWS.
            Upload, organize, and access your photos securely from anywhere.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary btn-lg group">
              Start for free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Sign in
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="card-glass p-1 shadow-2xl ring-1 ring-white/10">
            <div className="bg-surface-900 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-danger-500/80" />
                <div className="w-3 h-3 rounded-full bg-warning-500/80" />
                <div className="w-3 h-3 rounded-full bg-success-500/80" />
                <div className="flex-1 mx-4 h-6 bg-surface-800 rounded-lg flex items-center px-3">
                  <span className="text-surface-500 text-xs">app.cloudsnap.io/app/photos</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, hsl(${220 + i * 25}, 70%, 20%), hsl(${240 + i * 20}, 60%, 30%))`,
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                      <Image className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Built for security and performance
            </h2>
            <p className="text-surface-400 text-lg max-w-xl mx-auto">
              Every part of CloudSnap is designed with AWS best practices and zero-trust security principles.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6 hover:border-surface-600/60 transition-all duration-300 hover:-translate-y-0.5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card-glass p-12 ring-1 ring-primary-500/20 shadow-glow-lg">
            <Camera className="w-12 h-12 text-primary-400 mx-auto mb-6" />
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Ready to secure your memories?
            </h2>
            <p className="text-surface-400 mb-8">
              Create your account and start uploading in minutes.
              Requires your own AWS account for full functionality.
            </p>
            <Link to="/register" className="btn-primary btn-lg">
              Create free account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800/60 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-semibold text-white text-sm">CloudSnap</span>
          </div>
          <p className="text-surface-500 text-xs">
            © {new Date().getFullYear()} CloudSnap. MIT License. Built with AWS.
          </p>
        </div>
      </footer>
    </div>
  );
}
