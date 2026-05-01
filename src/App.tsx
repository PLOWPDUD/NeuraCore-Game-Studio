/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameEngineProvider } from './store/GameEngineStore';
import { GameEngineUI } from './components/GameEngineUI';

export default function App() {
  return (
    <GameEngineProvider>
      <GameEngineUI />
    </GameEngineProvider>
  );
}
