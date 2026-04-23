import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Cell {
  isBomb: boolean;
  revealed: boolean;
  neighborCount: number;
}

const BOARD_SIZE = 320;

const Minesweeper = () => {
  const [size, setSize] = useState('10');
  const [bombs, setBombs] = useState('10');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [firstClick, setFirstClick] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const createEmptyBoard = (s: number) =>
    Array.from({ length: s }, () =>
      Array.from({ length: s }, () => ({
        isBomb: false,
        revealed: false,
        neighborCount: 0,
      }))
    );

  const count = (g: Cell[][], r: number, c: number) => {
    let n = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        if (g[r + i]?.[c + j]?.isBomb) n++;
      }
    }
    return n;
  };

  const generate = (grid: Cell[][], safeR: number, safeC: number, bombCount: number) => {
    const s = grid.length;
    let placed = 0;

    while (placed < bombCount) {
      const r = Math.floor(Math.random() * s);
      const c = Math.floor(Math.random() * s);

      if (!grid[r][c].isBomb && !(r === safeR && c === safeC)) {
        grid[r][c].isBomb = true;
        placed++;
      }
    }

    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (!grid[r][c].isBomb) {
          grid[r][c].neighborCount = count(grid, r, c);
        }
      }
    }
  };

  const floodFill = (g: Cell[][], r: number, c: number) => {
    const stack: [number, number][] = [[r, c]];

    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const cell = g[cr]?.[cc];
      if (!cell || cell.revealed || cell.isBomb) continue;

      cell.revealed = true;

      if (cell.neighborCount === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i !== 0 || j !== 0) {
              stack.push([cr + i, cc + j]);
            }
          }
        }
      }
    }
  };

  const reveal = (r: number, c: number) => {
    setBoard(prev => {
      let grid = prev.map(row => row.map(cell => ({ ...cell })));

      const s = grid.length || parseInt(size) || 10;
      const bombCount = Math.max(1, parseInt(bombs) || 10);

      if (!firstClick) {
        setFirstClick(true);
        setGameOver(false);

        grid = createEmptyBoard(s);
        generate(grid, r, c, Math.min(bombCount, s * s - 1));
      }

      const cell = grid[r]?.[c];
      if (!cell || cell.revealed) return prev;

      if (cell.isBomb) {
        grid.forEach(row =>
          row.forEach(c => {
            if (c.isBomb) c.revealed = true;
          })
        );
        setGameOver(true);
        return grid;
      }

      floodFill(grid, r, c);

      return grid;
    });
  };

  const regenerate = () => {
    const s = Math.max(2, parseInt(size) || 10);
    setBoard(createEmptyBoard(s));
    setFirstClick(false);
    setGameOver(false);
  };

  const s = Math.max(2, parseInt(size) || 10);

  // ✅ FIX: stable cell size that ALWAYS fits board nicely
  const cellSize = Math.floor(Math.min(BOARD_SIZE / s, 32));

  const contentSize = Math.max(10, cellSize * 0.6);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.controls}>
        <Text>Grid Size</Text>
        <TextInput
          style={styles.input}
          value={size}
          onChangeText={setSize}
          keyboardType="numeric"
        />

        <Text>Bombs</Text>
        <TextInput
          style={styles.input}
          value={bombs}
          onChangeText={setBombs}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={regenerate}>
          <Text style={{ color: 'white' }}>RESET</Text>
        </TouchableOpacity>
      </View>

      {gameOver && <Text style={styles.gameOver}>GAME OVER</Text>}

      <View style={[styles.board, {
        width: cellSize * s,
        height: cellSize * s,
      }]}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <TouchableOpacity
              key={`${r}-${c}`}
              onPress={() => reveal(r, c)}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  left: c * cellSize,
                  top: r * cellSize,
                },
              ]}
            >
              {cell.revealed &&
                (cell.isBomb ? (
                  <Text style={{ fontSize: contentSize }}>
                    💣
                  </Text>
                ) : (
                  cell.neighborCount > 0 && (
                    <Text style={{ fontSize: contentSize, fontWeight: 'normal' }}>
                      {cell.neighborCount}
                    </Text>
                  )
                ))}
            </TouchableOpacity>
          ))
        )}
      </View>

    </SafeAreaView>
  );
};

export default Minesweeper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },

  controls: {
    width: '80%',
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },

  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    alignItems: 'center',
  },

  board: {
    position: 'relative',
    borderWidth: 1,
    overflow: 'hidden',
  },

  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gameOver: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});