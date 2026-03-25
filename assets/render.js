async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function getFocus() {
  const p = new URLSearchParams(window.location.search);
  return (p.get("focus") || "fullstack").toLowerCase();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }

  for (const c of children) node.appendChild(c);
  return node;
}

function renderList(items) {
  const ul = el("ul");
  for (const t of items) ul.appendChild(el("li", { text: t }));
  return ul;
}

function bulletAllowed(bullet, focus) {
  const f = (bullet.focus || ["fullstack", "backend", "frontend"]).map((x) =>
    x.toLowerCase()
  );
  return f.includes(focus);
}

function renderSkills(skills) {
  const cardChildren = [];

  if (skills.summary) {
    cardChildren.push(el("div", { class: "small", text: skills.summary }));
  }

  if (Array.isArray(skills.groups) && skills.groups.length) {
    for (const group of skills.groups) {
      cardChildren.push(
        el("div", { class: "skill-row" }, [
          el("div", { class: "skill-label", text: group.title }),
          el("div", {
            class: "skill-values",
            text: (group.items || []).join(" · "),
          }),
        ])
      );
    }
  } else if (Array.isArray(skills.items) && skills.items.length) {
    cardChildren.push(renderList(skills.items));
  }

  return el("div", { class: "card skills-card" }, cardChildren);
}

function renderCV(data, focus) {
  document.title = `${data.person.name} — ${data.labels.cvTitle}`;

  const root = document.getElementById("app");
  root.innerHTML = "";

  const header = el("div", { class: "header" }, [
    el("div", {}, [
      el("h1", { text: data.person.name }),
      el("div", {
        class: "meta",
        text: `${data.person.location} • ${data.person.availability}`,
      }),
    ]),
    el("div", { class: "meta" }, [
      el("div", {}, [
        el("a", {
          href: data.person.links.github,
          target: "_blank",
          rel: "noreferrer",
          text: "GitHub",
        }),
        document.createTextNode(" • "),
        el("a", {
          href: data.person.links.linkedin,
          target: "_blank",
          rel: "noreferrer",
          text: "LinkedIn",
        }),
      ]),
    ]),
  ]);

  const left = el("div");
  const right = el("div");

  left.appendChild(
    el("div", { class: "section" }, [
      el("h2", { text: data.labels.profile }),
      el("div", { class: "card" }, [el("p", { text: data.profile })]),
    ])
  );

  const projectsWrap = el("div", { class: "section" }, [
    el("h2", { text: data.labels.projects }),
    el("div", { class: "card" }),
  ]);

  const projectsCard = projectsWrap.querySelector(".card");

  for (const proj of data.projects) {
    const bullets = proj.bullets
      .filter((b) => bulletAllowed(b, focus))
      .map((b) => b.text);

    const titleLine = el("div", { class: "title" });
    titleLine.appendChild(
      document.createTextNode(`${proj.name} — ${proj.tagline}`)
    );

    if (proj.links?.repo) {
      titleLine.appendChild(document.createTextNode(" "));
      titleLine.appendChild(
        el("a", {
          href: proj.links.repo,
          target: "_blank",
          rel: "noreferrer",
          text: data.labels.repo,
        })
      );
    }

    const itemChildren = [
      titleLine,
      el("div", { class: "sub", text: proj.stack }),
    ];

    if (bullets.length) {
      itemChildren.push(renderList(bullets));
    }

    projectsCard.appendChild(el("div", { class: "item" }, itemChildren));
  }

  left.appendChild(projectsWrap);

  const expWrap = el("div", { class: "section" }, [
    el("h2", { text: data.labels.experience }),
    el("div", { class: "card" }),
  ]);

  const expCard = expWrap.querySelector(".card");

  for (const e of data.experience) {
    const children = [
      el("div", { class: "title", text: e.title }),
      el("div", { class: "sub", text: e.period }),
    ];

    if (e.bullets?.length) {
      children.push(renderList(e.bullets));
    }

    expCard.appendChild(el("div", { class: "item" }, children));
  }

  left.appendChild(expWrap);

//   right.appendChild(
//     el("div", { class: "section" }, [
//       el("h2", { text: data.labels.status }),
//       el("div", { class: "card" }, [
//         el("div", { class: "kv" }, [
//           el("div", { text: data.labels.workAuthorization }),
//           el("div", { text: data.person.workAuthorization }),
//           el("div", { text: data.labels.availableFrom }),
//           el("div", { text: data.person.availableFrom }),
//         ]),
//       ]),
//     ])
//   );

  right.appendChild(
    el("div", { class: "section" }, [
      el("h2", { text: data.labels.skills }),
      renderSkills(data.skills),
    ])
  );

  right.appendChild(
    el("div", { class: "section" }, [
      el("h2", { text: data.labels.education }),
      el(
        "div",
        { class: "card" },
        data.education.map((ed) =>
          el("div", { class: "item" }, [
            el("div", { class: "title", text: ed.title }),
            el("div", { class: "sub", text: ed.details }),
          ])
        )
      ),
    ])
  );

  right.appendChild(
    el("div", { class: "section" }, [
      el("h2", { text: data.labels.languages }),
      el("div", { class: "card" }, [renderList(data.languages)]),
    ])
  );

  const grid = el("div", { class: "grid" }, [left, right]);

  const footer = el("div", { class: "footer" }, [
    el("div", { class: "print-hint", text: data.labels.printHint }),
  ]);

  root.appendChild(header);
  root.appendChild(grid);
  root.appendChild(footer);
}

(async function main() {
  const focus = getFocus();
  const dataPath = document.documentElement.getAttribute("data-cv-json");
  const data = await loadJSON(dataPath);
  renderCV(data, focus);
})().catch((err) => {
  const root = document.getElementById("app");
  if (root) root.textContent = String(err);
  console.error(err);
});