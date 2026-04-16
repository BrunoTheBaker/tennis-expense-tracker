export async function GET() {
  return Response.json({
    RECKON_CLIENT_ID:        !!process.env.RECKON_CLIENT_ID,
    RECKON_CLIENT_SECRET:    !!process.env.RECKON_CLIENT_SECRET,
    RECKON_SUBSCRIPTION_KEY: !!process.env.RECKON_SUBSCRIPTION_KEY,
    RECKON_BOOK_ID:          !!process.env.RECKON_BOOK_ID,
    RECKON_REDIRECT_URI:     !!process.env.RECKON_REDIRECT_URI,
    RECKON_USERNAME:         !!process.env.RECKON_USERNAME,
    RECKON_PASSWORD:         !!process.env.RECKON_PASSWORD,
    CLIENT_ID_PREFIX:        process.env.RECKON_CLIENT_ID?.slice(0, 4),
    USERNAME_VALUE:          process.env.RECKON_USERNAME,
  })
}
