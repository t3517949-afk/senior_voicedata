
  # 语音实验数据展示网站

  This is a code bundle for 语音实验数据展示网站. The original project is available at https://www.figma.com/design/dj2dvGHIfrlDYfOaL0pZb0/%E8%AF%AD%E9%9F%B3%E5%AE%9E%E9%AA%8C%E6%95%B0%E6%8D%AE%E5%B1%95%E7%A4%BA%E7%BD%91%E7%AB%99.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Quick open entry

  On macOS, you can directly double-click `一键启动.command` in the project root.

  On first launch it will automatically install dependencies, start the local website, and open the browser.

  It will prefer `http://127.0.0.1:4173`, and if that port is already occupied it will automatically switch to the next available local port.

  ## Local igraph source

  The local igraph source tree from `/Users/imt/Documents/igraph-main 2` is linked into this project at `vendor/igraph-source`.

  A frontend integration wrapper is prepared at `src/lib/igraph/index.ts` for future wasm or backend-based graph features.

  ## Backend prep

  A backend scaffold is now available in `backend/` for later HanLP preprocessing, fastText vectorization and igraph-based graph modeling.

  It expects the local fastText source to be linked at `vendor/fasttext-source` and a fastText `.bin` model file to be placed at `vendor/models/fasttext.bin`, or provided with the `FASTTEXT_MODEL_PATH` environment variable.

  The local HanLP source is linked at `vendor/hanlp-source`, and its default cache directory is `vendor/models/hanlp`.
  
  The local FZSpeak source is linked at `vendor/fzspeak-source`.
  A backend machine-scoring endpoint is available at `POST /api/audio/machine-score` for speech-data cards.
  This endpoint now uses XFYUN official ISE WebSocket API when `XFYUN_APPID`, `XFYUN_API_KEY`, and `XFYUN_API_SECRET` are configured in `backend/.env` or environment variables.
  
