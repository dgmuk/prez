export default function Logo({ size = 40 }) {
  return (
    <div className="logo-mark" style={{ width: size, height: size, fontSize: size > 36 ? 14 : 12 }} aria-label="ДМ">
      ДМ
    </div>
  )
}
